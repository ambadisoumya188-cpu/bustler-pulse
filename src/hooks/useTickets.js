import { useState, useEffect, useCallback } from 'react';
import { adaptManyFromBustler } from '../utils/adapter.js';
import { INITIAL_TICKETS } from '../data/dummy.js';

const BACKEND_URL = 'https://bustler-pulse.onrender.com';
const notifiedIds = new Set();

export function useTickets() {
  const [tickets, setTickets] = useState([...INITIAL_TICKETS]);
  const [incomingQueue, setIncomingQueue] = useState([]);
  const [connected, setConnected] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch(BACKEND_URL + '/tickets/');
      const data = await res.json();
      if (!data || !data.length) return;

      const realTickets = adaptManyFromBustler(data);

      setTickets(prev => {
        const merged = [...prev];
        realTickets.forEach(rt => {
          const idx = merged.findIndex(t => t._backend_id === rt._backend_id);
          if (idx >= 0) merged[idx] = { ...merged[idx], ...rt };
          else merged.unshift(rt);
        });
        return merged;
      });

      setIncomingQueue(prev => {
        const next = [...prev];
        realTickets.forEach(rt => {
          if (rt.status === 'resolved') return;
          if (rt.urgency !== 'Critical' && !rt.anger_detected) return;
          if (next.find(q => q.id === ('#' + rt._backend_id))) return;
          next.push({
            id: '#' + rt._backend_id,
            user: rt.user || 'Unknown User',
            msg: rt.message || 'New complaint',
            time: 'Just now',
            _backend_id: rt._backend_id,
            _triaged: rt._triaged,
            category: rt.category,
            urgency: rt.urgency,
            urgency_score: rt.urgency_score,
            anger_detected: rt.anger_detected,
            route_to: rt.route_to,
            auto_reply: rt.auto_reply,
            auto_reply_sent: rt.auto_reply_sent
          });
        });
        return next;
      });

      data.forEach(t => {
        if ((t.urgency === 'critical' || t.is_anger_flagged === 1) && !notifiedIds.has(t.id)) {
          notifiedIds.add(t.id);
          if (Notification.permission === 'granted') {
            new Notification('🔴 Critical Ticket!', {
              body: (t.user_id || 'User') + ': ' + (t.description || 'Urgent issue').substring(0, 80)
            });
          }
        }
      });

      setConnected(true);
      setTicketCount(realTickets.length);
    } catch (e) {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (Notification.permission !== 'granted') Notification.requestPermission();
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const resolveTicket = useCallback(async (ticket) => {
    setTickets(prev => prev.map(t =>
      t._backend_id === ticket._backend_id ? { ...t, status: 'resolved' } : t
    ));
    setIncomingQueue(prev => prev.filter(q => q.id !== ('#' + ticket._backend_id)));
    if (ticket._backend_id) {
      try {
        await fetch(BACKEND_URL + '/tickets/' + ticket._backend_id + '/resolve', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resolution_notes: 'Resolved by ' + ticket.agent,
            what_broke: ticket.category + ' — ' + ticket.title,
            why_it_happened: 'Issue identified by ops team',
            how_fixed: 'Issue resolved by ' + ticket.agent,
            csat_score: 5
          })
        });
      } catch (e) {}
    }
  }, []);

  const escalateTicket = useCallback(async (ticket) => {
    if (!ticket._backend_id) return false;
    try {
      const res = await fetch(BACKEND_URL + '/tickets/' + ticket._backend_id + '/escalate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Customer requires senior agent attention' })
      });
      if (res.ok) {
        setTickets(prev => prev.map(t =>
          t._backend_id === ticket._backend_id
            ? { ...t, category: 'Dispute', route: 'dispute', status: 'progress', agent: 'Anjali P Remesh', _escalated: true }
            : t
        ));
        setIncomingQueue(prev => prev.filter(q => q.id !== ('#' + ticket._backend_id)));
        return true;
      }
      if (res.status === 400) { alert('⚠️ Already resolved, cannot escalate.'); return false; }
      if (res.status === 404) { alert('⚠️ Ticket not found.'); return false; }
    } catch (e) {}
    return false;
  }, []);

  return { tickets, setTickets, incomingQueue, setIncomingQueue, connected, ticketCount, fetchTickets, resolveTicket, escalateTicket };
}