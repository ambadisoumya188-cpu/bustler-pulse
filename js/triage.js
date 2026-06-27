// ══════════════════════════════════════
// BUSTLER PULSE — TRIAGE.JS
// AI Triage Engine — reads REAL triage results from Adhilekshmi's backend
// ══════════════════════════════════════

const BACKEND_URL_TRIAGE = 'https://bustler-pulse.onrender.com';

let incomingQueue    = [...INCOMING];
let triageAutoCount  = parseInt(localStorage.getItem('triage_auto')  || '0');
let triageAngerCount = parseInt(localStorage.getItem('triage_anger') || '0');
let triageTotal      = parseInt(localStorage.getItem('triage_total') || '0');
let latestProcessedTicket = null;
let latestProcessedResult = null;

function renderIncomingQueue() {
  const el = document.getElementById('incoming-queue');
  if (!el) return;

  incomingQueue.sort((a, b) => {
    const aAnger = a.anger_detected ? 1 : 0;
    const bAnger = b.anger_detected ? 1 : 0;
    if (aAnger !== bAnger) return bAnger - aAnger;
    return (b.urgency_score || 0) - (a.urgency_score || 0);
  });

  if (incomingQueue.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);font-size:13px">✓ All complaints processed</div>';
    const btn = document.getElementById('process-all-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'All Processed'; }
    return;
  }

  el.innerHTML = incomingQueue.map((item, idx) => `
    <div class="queue-item ${idx === 0 ? 'next' : ''}" style="cursor:pointer" onclick="processQueueItem('${item.id}', this)">
      <div class="qi-dot" style="background:${idx === 0 ? 'var(--green)' : 'var(--text3)'}"></div>
      <div class="qi-body">
        <div class="qi-user">${item.user}
          <span style="font-size:11px;color:var(--text3);font-weight:400;margin-left:6px">${item.time}</span>
        </div>
        <div class="qi-msg">${item.msg}</div>
        <div class="qi-id">${item.id}</div>
      </div>
      ${idx === 0 ? '<span class="next-badge">NEXT</span>' : ''}
    </div>
  `).join('');

  const countEl = document.getElementById('queue-count');
  if (countEl) countEl.textContent = incomingQueue.length + ' waiting';
  const queueStatEl = document.getElementById('t-queue-count');
  if (queueStatEl) queueStatEl.textContent = incomingQueue.length;

  const btn = document.getElementById('process-all-btn');
  if (btn && btn.disabled && btn.textContent.trim() === 'All Processed') {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5.5"/><path d="M5 7l1.5 1.5L9 5" stroke-linecap="round" stroke-linejoin="round"/></svg> Process Next with AI`;
  }
}

async function processNext() {
  if (incomingQueue.length === 0) return;
  await processTicket(incomingQueue[0]);
}

function processQueueItem(ticketId, el) {
  const ticket = incomingQueue.find(q => q.id === ticketId);
  if (!ticket) return;

  if (el) {
    el.classList.add('next');
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.7';
  }

  processTicket(ticket);
}

async function processTicket(ticket) {
  const btn = document.getElementById('process-all-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
  const thinking = document.getElementById('triage-thinking');
  if (thinking) thinking.classList.add('show');

  let result;
  try {
    const minDelay = new Promise(resolve => setTimeout(resolve, 350));
    const [triageData] = await Promise.all([getTriageResult(ticket), minDelay]);
    result = triageData;
  } catch (e) {
    console.log('Could not load real triage result:', e.message);
    result = unavailableResult();
  }

  const idx = incomingQueue.findIndex(q => q.id === ticket.id);
  if (idx !== -1) incomingQueue.splice(idx, 1);
  renderIncomingQueue();
  latestProcessedTicket = ticket;
  latestProcessedResult = result;
  showLatestResult(ticket, result);
  addProcessedTicket(ticket, result);

  triageTotal++;
  if (result.auto_resolvable) triageAutoCount++;
  if (result.anger_detected)  triageAngerCount++;
  updateTriageStats();

  if (thinking) thinking.classList.remove('show');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5.5"/><path d="M5 7l1.5 1.5L9 5" stroke-linecap="round" stroke-linejoin="round"/></svg> Process Next with AI`;
  }
}

async function getTriageResult(ticket) {
  if (ticket._triaged) {
    return {
      category:        ticket.category || 'General Issue',
      urgency:          ticket.urgency || 'Medium',
      urgency_score:    ticket.urgency_score || 2,
      anger_detected:   !!ticket.anger_detected,
      route_to:         ticket.route_to || 'Unassigned',
      auto_reply:       ticket.auto_reply || 'No automatic reply was generated for this ticket.',
      summary:          ticket.msg ? ticket.msg.substring(0, 80) : 'Ticket triaged',
      auto_resolvable:  !!ticket.auto_reply_sent,
      _isRealAI:        true
    };
  }

  if (!ticket._backend_id) {
    throw new Error('No backend ticket id — cannot run real triage on this ticket');
  }

  const res = await fetch(BACKEND_URL_TRIAGE + '/tickets/' + ticket._backend_id + '/triage', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Triage request failed: ' + res.status);

  const data = await res.json();
  const urgencyInfo = URGENCY_MAP[(data.urgency || 'medium').toLowerCase()] || URGENCY_MAP['medium'];

  return {
    category:        ticket.category || 'General Issue',
    urgency:          urgencyInfo.urgency,
    urgency_score:    urgencyInfo.score,
    anger_detected:   data.is_anger_flagged === 1,
    route_to:         labelRouteTo(data.route_to) || 'Unassigned',
    auto_reply:       data.auto_reply || 'No automatic reply was generated for this ticket.',
    summary:          ticket.msg ? ticket.msg.substring(0, 80) : 'Ticket triaged',
    auto_resolvable:  data.auto_reply_sent === 1,
    _isRealAI:        true
  };
}

function unavailableResult() {
  return {
    category: 'General Issue', urgency: 'Medium', urgency_score: 2,
    anger_detected: false, route_to: 'Unassigned',
    auto_reply: 'Triage service could not be reached — please review this ticket manually.',
    summary: 'Triage unavailable', auto_resolvable: false, _isRealAI: false
  };
}

function showLatestResult(ticket, r) {
  const el = document.getElementById('latest-result');
  if (!el) return;

  const tagMap   = { 'Bug Report':'tag-bug', 'User Confusion':'tag-confusion', 'Feature Feedback':'tag-feedback', 'Dispute':'tag-dispute', 'General Issue':'tag-confusion' };
  const urgMap   = { 'Critical':'ub-critical', 'High':'ub-high', 'Medium':'ub-high', 'Low':'ub-low' };
  const widthMap = { 1:'33%', 2:'66%', 3:'100%' };
  const colorMap = { 1:'var(--green)', 2:'var(--amber)', 3:'var(--red)' };

  const backendId = ticket._backend_id;
  const matchedTicket = backendId ? TICKETS.find(t => String(t._backend_id) === String(backendId)) : null;
  const alreadyResolved  = matchedTicket && matchedTicket.status === 'resolved';
  const alreadyEscalated = matchedTicket && matchedTicket.category === 'Dispute';

  el.innerHTML = `
    <div style="animation:fadeUp .3s ease">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:500;color:var(--text)">${ticket.user}</div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:10px;color:var(--text3);font-family:monospace">${ticket.id}</span>
          ${r._isRealAI
            ? '<span style="font-size:10px;padding:2px 7px;background:var(--gdim);color:var(--green);border:1px solid var(--gborder);border-radius:10px">Real AI</span>'
            : '<span style="font-size:10px;padding:2px 7px;background:var(--rdim);color:var(--red);border:1px solid rgba(240,82,82,.25);border-radius:10px">Unavailable</span>'
          }
        </div>
      </div>
      <div style="font-size:12px;color:var(--text2);line-height:1.55;background:var(--bg3);padding:10px 12px;border-radius:8px;margin-bottom:12px">${ticket.msg}</div>
      ${r.anger_detected ? '<div style="background:var(--rdim);border:1px solid rgba(240,82,82,.25);border-radius:8px;padding:9px 12px;font-size:12px;color:var(--red);margin-bottom:12px">⚠️ Anger detected — priority handling required</div>' : ''}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
        <span class="tag ${tagMap[r.category]||'tag-confusion'}">${r.category}</span>
        <span class="urgency-badge ${urgMap[r.urgency]||'ub-low'}">${r.urgency}</span>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-size:11px;color:var(--text3);margin-bottom:5px;display:flex;justify-content:space-between"><span>Urgency</span><span>${r.urgency_score}/3</span></div>
        <div class="track"><div class="track-fill" style="width:${widthMap[r.urgency_score]};background:${colorMap[r.urgency_score]}"></div></div>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Routed to</div>
      <div style="font-size:13px;font-weight:500;color:var(--green);margin-bottom:12px">→ ${r.route_to}</div>
      <div style="font-size:11px;color:var(--green);text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:5px">Auto-reply sent to user</div>
      <div style="background:var(--bg3);border-left:3px solid var(--green);border-radius:0 8px 8px 0;padding:10px 12px;font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:14px">${r.auto_reply}</div>
      ${matchedTicket ? `
      <div style="display:flex;gap:8px">
        <button onclick="triagePanelResolve('${backendId}')" ${alreadyResolved ? 'disabled' : ''}
          style="flex:1;padding:9px 0;border-radius:8px;border:1px solid var(--gborder);background:${alreadyResolved ? 'var(--bg3)' : 'var(--gdim)'};color:var(--green);font-size:12px;font-weight:500;cursor:${alreadyResolved ? 'default' : 'pointer'};opacity:${alreadyResolved ? '.5' : '1'}">
          ${alreadyResolved ? '✓ Resolved' : 'Resolve'}
        </button>
        <button onclick="triagePanelEscalate('${backendId}')" ${(alreadyResolved || alreadyEscalated) ? 'disabled' : ''}
          style="flex:1;padding:9px 0;border-radius:8px;border:1px solid rgba(240,82,82,.25);background:${(alreadyResolved||alreadyEscalated) ? 'var(--bg3)' : 'var(--rdim)'};color:var(--red);font-size:12px;font-weight:500;cursor:${(alreadyResolved||alreadyEscalated) ? 'default' : 'pointer'};opacity:${(alreadyResolved||alreadyEscalated) ? '.5' : '1'}">
          ${alreadyEscalated ? '✓ Escalated' : 'Escalate'}
        </button>
      </div>` : ''}
    </div>`;
}

function triagePanelResolve(backendId) {
  const t = TICKETS.find(t => String(t._backend_id) === String(backendId));
  if (!t) return;
  selectedTicket = t;
  resolveTicket();
  if (latestProcessedTicket) showLatestResult(latestProcessedTicket, latestProcessedResult);
}

async function triagePanelEscalate(backendId) {
  const t = TICKETS.find(t => String(t._backend_id) === String(backendId));
  if (!t) return;
  selectedTicket = t;
  await escalateTicket();
  if (latestProcessedTicket) showLatestResult(latestProcessedTicket, latestProcessedResult);
}

function addProcessedTicket(ticket, result) {
  const backendId = ticket._backend_id || (ticket.id ? String(ticket.id).replace('#', '') : null);
  const existing = backendId ? TICKETS.find(t => String(t._backend_id) === String(backendId)) : null;

  if (existing) {
    existing.category       = result.category;
    existing.urgency        = result.urgency;
    existing.urgency_score  = result.urgency_score;
    existing.anger_detected = result.anger_detected;
    existing.route_to       = result.route_to;
  } else {
    const newId = 'TKT-' + String(TICKETS.length + 1).padStart(3, '0');
    TICKETS.unshift({ id:newId, user:ticket.user, title:result.summary||ticket.msg.substring(0,50), message:ticket.msg, category:result.category, urgency:result.urgency, urgency_score:result.urgency_score, status:'open', agent:'Ambadi Sajan', time:'Just now', route:'bug' });
  }

  const openCount = TICKETS.filter(t => t.status==='open'||t.status==='progress').length;
  const nbOpen = document.getElementById('nb-open');
  const sOpen  = document.getElementById('s-open');
  if (nbOpen) nbOpen.textContent = openCount;
  if (sOpen)  sOpen.textContent  = openCount;
  renderTickets();
  renderDashboard();
  updateSidebarBadges();
}

function updateTriageStats() {
  const autoEl  = document.getElementById('t-auto');
  const angerEl = document.getElementById('t-anger');
  const totalEl = document.getElementById('t-queue-count');
  if (autoEl)  autoEl.textContent  = triageAutoCount;
  if (angerEl) angerEl.textContent = triageAngerCount;
  if (totalEl) totalEl.textContent = incomingQueue.length;

  localStorage.setItem('triage_auto',  triageAutoCount);
  localStorage.setItem('triage_anger', triageAngerCount);
  localStorage.setItem('triage_total', triageTotal);
}