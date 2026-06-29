// ══════════════════════════════════════
// BUSTLER PULSE — APP.JS
// Main controller + fetch real tickets from backend
// ══════════════════════════════════════

const BACKEND_URL = 'https://bustler-pulse.onrender.com';
let notifiedTicketIds = new Set();
// ── KEEP SIDEBAR BADGES REAL ──
// AI Triage, Urgent Queue, and Disputes badges used to be frozen at whatever
// the original demo data said. This recalculates them from the real ticket
// list every time something changes.
function updateSidebarBadges() {
  const nbTriage  = document.getElementById('nb-triage');
  const nbUrgent  = document.getElementById('nb-urgent');
  const nbDispute = document.getElementById('nb-dispute');

  if (nbTriage)  nbTriage.textContent  = incomingQueue.length;
  if (nbUrgent)  nbUrgent.textContent  = TICKETS.filter(t => t.urgency_score === 3 && t.status !== 'resolved').length;
  if (nbDispute) nbDispute.textContent = TICKETS.filter(t => t.category === 'Dispute' && t.status !== 'resolved').length;
}// ── FEEDBACK BADGE ──
// Shows how many feedback entries haven't been looked at yet. Clears itself
// the moment the Feedback page is opened.
function setFeedbackBadge(count) {
  const badge = document.getElementById('nb-feedback');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

function checkFeedbackBadge() {
  fetch('https://bustler-pulse.onrender.com/feedback/')
    .then(r => r.json())
    .then(data => {
      const seen = JSON.parse(localStorage.getItem('seenFeedbackIds') || '[]');
      const feedbackPage = document.getElementById('page-feedback');
      const isOpen = feedbackPage && feedbackPage.classList.contains('active');

      if (isOpen) {
        const allIds = data.map(f => f.ticket_id || f.id);
        localStorage.setItem('seenFeedbackIds', JSON.stringify(allIds));
        setFeedbackBadge(0);
      } else {
        const newCount = data.filter(f => !seen.includes(f.ticket_id || f.id)).length;
        setFeedbackBadge(newCount);
      }
    })
    .catch(() => {});
}
function applyLoggedInUser() {
  const username = (typeof getUser === 'function') ? getUser() : 'Ops Agent';

  const nameEl = document.querySelector('.agent-name');
  if (nameEl) nameEl.textContent = username;

  const avatarEl = document.querySelector('.agent-av');
  if (avatarEl) {
    const initials = username.split(/[\s_]+/).filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase();
    avatarEl.textContent = initials || 'OA';
  }

  const subEl = document.getElementById('page-sub');
  if (subEl) subEl.textContent = 'Welcome back, ' + username + ' — here\'s today\'s overview';
}

// ── CLOCK ──
function updateClock() {
  const now = new Date();
  const el  = document.getElementById('clock');
  if (el) {
    el.textContent = now.toLocaleTimeString('en-IN', {
      hour:   '2-digit',
      minute: '2-digit'
    });
  }
}
updateClock();
setInterval(updateClock, 1000);

// ── FETCH REAL TICKETS FROM BACKEND ──
async function fetchRealTickets() {
  try {
    const res = await fetch(BACKEND_URL + '/tickets/');
    const data = await res.json();

    if (data && data.length > 0) {
      // Convert backend format to our format using adapter
      const realTickets = adaptManyFromBustler(data);

      // Merge real tickets with dummy tickets
      realTickets.forEach(realTicket => {
        const exists = TICKETS.find(t => t._backend_id === realTicket._backend_id);
        if (!exists) {
          TICKETS.unshift(realTicket);
        }
      });
      checkForCriticalTickets(data);   // use raw backend data, before adapter changes field names

      realTickets.forEach(realTicket => {
        if (realTicket.status === 'resolved') return;
        if (realTicket.urgency !== 'Critical' && !realTicket.anger_detected) return;

        const alreadyInQueue = incomingQueue.find(q => q.id === ('#' + realTicket._backend_id));
        if (alreadyInQueue) return;

        incomingQueue.push({
          id:   '#' + realTicket._backend_id,
          user: realTicket.user || 'Unknown User',
          msg:  realTicket.message || realTicket.description || 'New complaint',
          time: 'Just now',
          // Real triage fields, already auto-triaged server-side by Adhilekshmi's
          // backend — triage.js reads these directly instead of calling any AI itself.
          _backend_id:     realTicket._backend_id,
          _triaged:        realTicket._triaged,
          category:        realTicket.category,
          urgency:          realTicket.urgency,
          urgency_score:    realTicket.urgency_score,
          anger_detected:   realTicket.anger_detected,
          route_to:         realTicket.route_to,
          auto_reply:       realTicket.auto_reply,
          auto_reply_sent:  realTicket.auto_reply_sent
        });
      });
      renderIncomingQueue();

      // Update stats
      const openCount = TICKETS.filter(t => t.status === 'open' || t.status === 'progress').length;
      const nbOpen    = document.getElementById('nb-open');
      const sOpen     = document.getElementById('s-open');
      if (nbOpen) nbOpen.textContent = openCount;
      if (sOpen)  sOpen.textContent  = openCount;

      // Re-render
      renderTickets();
      renderDashboard();
      updateSidebarBadges();

      console.log('Real tickets loaded from backend:', realTickets.length);
      showConnectionStatus(true, realTickets.length);
    }

  } catch (e) {
    console.log('Backend not available — using dummy data');
    showConnectionStatus(false, 0);
  }
}

// ── SEND RESOLUTION BACK TO BACKEND ──
async function sendResolutionToBackend(ticket) {
  if (!ticket._backend_id) return;

  try {
    const res = await fetch(
      BACKEND_URL + '/tickets/' + ticket._backend_id + '/resolve',
      {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_notes: 'Resolved by ' + ticket.agent,
          what_broke:       ticket.category + ' — ' + ticket.title,
          why_it_happened:  'Issue identified and investigated by ops team',
          how_fixed:        'Issue resolved and verified by ' + ticket.agent,
          csat_score:       5
        })
      }
    );

    if (res.ok) {
      console.log('Resolution sent to backend for ticket:', ticket._backend_id);
    } else {
      console.log('Backend returned error:', res.status);
    }
  } catch (e) {
    console.log('Could not send resolution to backend:', e.message);
  }
}

// ── SHOW CONNECTION STATUS ──
function showConnectionStatus(connected, count) {
  const pill = document.querySelector('.status-pill');
  if (!pill) return;

  if (connected) {
    pill.style.background  = 'var(--gdim)';
    pill.style.color       = 'var(--green)';
    pill.style.borderColor = 'var(--gborder)';
    pill.innerHTML = `
      <svg width="8" height="8" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="4" fill="currentColor"/>
      </svg>
      Live — ${count} real ticket${count !== 1 ? 's' : ''} loaded`;
  } else {
    pill.style.background  = 'var(--adim)';
    pill.style.color       = 'var(--amber)';
    pill.style.borderColor = 'rgba(245,166,35,.3)';
    pill.innerHTML = `
      <svg width="8" height="8" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="4" fill="currentColor"/>
      </svg>
      Demo Mode — backend offline`;
  }
}
// ── CRITICAL TICKET NOTIFICATIONS ──
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

function checkForCriticalTickets(newTickets) {
  const criticalOnes = newTickets.filter(t => 
    (t.urgency === 'critical' || t.is_anger_flagged === 1) && 
    !notifiedTicketIds.has(t.id)
  );

  if (criticalOnes.length > 0) {
    criticalOnes.forEach(ticket => {
      showCriticalAlert(ticket);
      notifiedTicketIds.add(ticket.id);
    });
  }
}

function showCriticalAlert(ticket) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('🔴 Critical Ticket Alert!', {
      body: (ticket.user_id || 'User') + ': ' + (ticket.description || 'Urgent issue reported'),
      icon: 'https://cdn-icons-png.flaticon.com/512/564/564619.png'
    });
  }

  showToast('🔴 Critical ticket from ' + (ticket.user_id || 'a user') + '!');
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--red);
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ── PAGE NAVIGATION ──
function showPage(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  if (btn)  btn.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    tickets:   'All Tickets',
    triage:    'AI Triage',
    agents:    'Agent Profiles',
    feedback:  'User Feedback',
    health:    'System Health',
  };

  const subs = {
    dashboard: "Welcome back, " + ((typeof getUser === 'function') ? getUser() : 'Ambadi') + " — here's today's overview",
    tickets:   'Manage and resolve incoming user tickets',
    triage:    'Complaints arrive automatically — AI classifies and routes them',
    agents:    'Live performance profiles — updates every time a ticket is resolved',
    feedback:  'Ratings submitted by users after resolution',
    health:    'Track and manage known issues across Bustler',
  };

  const titleEl = document.getElementById('page-title');
  const subEl   = document.getElementById('page-sub');
  if (titleEl) titleEl.textContent = titles[name] || name;
  if (subEl)   subEl.textContent   = subs[name]   || '';

  if (name === 'agents') {
    renderAgentCards();
    renderLeaderboard();
    renderActivityFeed();
  }

  if (name === 'feedback') {
    renderFeedback();
    checkFeedbackBadge();
  }

  if (name === 'health') {
    renderHealth();
  }
}

// ── FILTER AND GO ──
function filterAndGo(filter) {
  currentFilter = filter;
  const ticketsBtn = document.querySelectorAll('.nav-item')[1];
  showPage('tickets', ticketsBtn);

  const tabMap = {
    urgent:   '🔴 Urgent',
    dispute:  '⚠️ Disputes',
    resolved: 'Resolved'
  };

  document.querySelectorAll('.ftab').forEach(t => {
    t.classList.remove('active');
    if (t.textContent.trim() === (tabMap[filter] || filter)) {
      t.classList.add('active');
    }
  });

  renderTickets();
}

// ── THEME TOGGLE ──
function setTheme(theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    document.getElementById('btn-light').classList.add('active');
    document.getElementById('btn-dark').classList.remove('active');
  } else {
    document.documentElement.classList.remove('light');
    document.getElementById('btn-dark').classList.add('active');
    document.getElementById('btn-light').classList.remove('active');
  }
  localStorage.setItem('bustler-theme', theme);
}

// ── AUTO REFRESH ──
function startAutoRefresh() {
  setInterval(() => {
    fetchRealTickets();
  }, 30000);

  // Auto refresh feedback every 30 seconds too
  setInterval(() => {
    const feedbackPage = document.getElementById('page-feedback');
    if (feedbackPage && feedbackPage.classList.contains('active')) {
      renderFeedback();
    }
    checkFeedbackBadge();
  }, 30000);
}

// ── INITIALISE APP ──
function initApp() {
   requestNotificationPermission();
  loadAgentStats();
  applyLoggedInUser();

  // Load saved theme
  const savedTheme = localStorage.getItem('bustler-theme') || 'dark';
  setTheme(savedTheme);

  // Render with dummy data first
  renderAgentCards();
  renderTickets();
  renderDashboard();
  renderIncomingQueue();
  updateSidebarBadges();
  checkFeedbackBadge();

  // Then fetch real tickets from backend
  fetchRealTickets();

  // Auto refresh every 30 seconds
  startAutoRefresh();
}

// Run when page loads
window.addEventListener('DOMContentLoaded', initApp);

// ── RENDER FEEDBACK ──
function renderFeedback() {
  const list = document.getElementById('feedback-list');
  if (!list) return;

  list.innerHTML = '<div style="padding:28px;color:#9a9da6;text-align:center">Loading...</div>';

  fetch('https://bustler-pulse.onrender.com/feedback/')
    .then(r => r.json())
    .then(data => {
      // Update stats
      document.getElementById('fb-total').textContent = data.length;

      const scores = data.map(f => f.csat_score).filter(s => s);
      const avg = scores.length
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        : '—';
      document.getElementById('fb-avg').textContent      = avg;
      document.getElementById('fb-positive').textContent = scores.filter(s => s >= 4).length;
      document.getElementById('fb-negative').textContent = scores.filter(s => s <= 2).length;

      if (!data.length) {
        list.innerHTML = '<div style="padding:28px;text-align:center;color:#5c5f6a;font-size:14px;">⭐ No feedback yet</div>';
        return;
      }

      list.innerHTML = data.map(f =>
        '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin-bottom:12px;display:flex;gap:16px;">' +
          '<div style="width:38px;height:38px;border-radius:50%;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0;color:var(--text);">' +
            (f.user||'?').charAt(0).toUpperCase() +
          '</div>' +
          '<div style="flex:1;">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
              '<span style="font-weight:500;font-size:14px;color:var(--text);">' + (f.user||'Anonymous') + '</span>' +
              '<span style="color:var(--text3);font-size:12px;">' + new Date(f.created_at).toLocaleDateString() + '</span>' +
            '</div>' +
            '<div style="font-size:14px;margin-bottom:6px;">' + '⭐'.repeat(f.csat_score||0) + '</div>' +
            '<div style="color:var(--text2);font-size:13px;">' + (f.comment||'') + '</div>' +
            (f.tag ? '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:var(--gdim);color:var(--green);margin-top:6px;display:inline-block;">' + f.tag + '</span>' : '') +
            '<div style="color:var(--text3);font-size:11px;margin-top:6px;">Ticket #' + f.ticket_id + '</div>' +
          '</div>' +
        '</div>'
      ).join('');
    })
    .catch(() => {
      list.innerHTML = '<div style="padding:28px;text-align:center;color:#5c5f6a;">Could not load feedback</div>';
    });
}