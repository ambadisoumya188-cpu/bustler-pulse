// ══════════════════════════════════════
// BUSTLER PULSE — TRIAGE.JS
// AI Triage Engine — now reads REAL triage results from Adhilekshmi's backend
// (the old direct-to-Claude browser call and fake keyword fallback are gone)
// ══════════════════════════════════════

const BACKEND_URL_TRIAGE = 'https://bustler-pulse.onrender.com';

let incomingQueue    = [...INCOMING];
let triageAutoCount  = parseInt(localStorage.getItem('triage_auto')  || '0');
let triageAngerCount = parseInt(localStorage.getItem('triage_anger') || '0');
let triageTotal      = parseInt(localStorage.getItem('triage_total') || '0');

// ── RENDER INCOMING QUEUE ──
function renderIncomingQueue() {
  const el = document.getElementById('incoming-queue');
  if (!el) return;

  if (incomingQueue.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);font-size:13px">✓ All complaints processed</div>';
    const btn = document.getElementById('process-all-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'All Processed'; }
    return;
  }

  el.innerHTML = incomingQueue.map((item, idx) => `
    <div class="queue-item ${idx === 0 ? 'next' : ''}">
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

  // If the queue started empty and real tickets arrived after, the button
  // can get stuck disabled on "All Processed" — re-enable it now that there's
  // work to do (but don't interrupt it mid-click while it says "Processing...").
  const btn = document.getElementById('process-all-btn');
  if (btn && btn.disabled && btn.textContent.trim() === 'All Processed') {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5.5"/><path d="M5 7l1.5 1.5L9 5" stroke-linecap="round" stroke-linejoin="round"/></svg> Process Next with AI`;
  }
}

// ── PROCESS NEXT ──
async function processNext() {
  if (incomingQueue.length === 0) return;
  const ticket = incomingQueue[0];

  const btn = document.getElementById('process-all-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
  const thinking = document.getElementById('triage-thinking');
  if (thinking) thinking.classList.add('show');

  let result;
  try {
    result = await getTriageResult(ticket);
  } catch (e) {
    console.log('Could not load real triage result:', e.message);
    result = unavailableResult();
  }

  incomingQueue.shift();
  renderIncomingQueue();
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

// ── GET TRIAGE RESULT ──
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

// ── ONLY shown if the real triage service can't be reached at all ──
function unavailableResult() {
  return {
    category: 'General Issue', urgency: 'Medium', urgency_score: 2,
    anger_detected: false, route_to: 'Unassigned',
    auto_reply: 'Triage service could not be reached — please review this ticket manually.',
    summary: 'Triage unavailable', auto_resolvable: false, _isRealAI: false
  };
}

// ── SHOW RESULT ──
function showLatestResult(ticket, r) {
  const el = document.getElementById('latest-result');
  if (!el) return;

  const tagMap   = { 'Bug Report':'tag-bug', 'User Confusion':'tag-confusion', 'Feature Feedback':'tag-feedback', 'Dispute':'tag-dispute', 'General Issue':'tag-confusion' };
  const urgMap   = { 'Critical':'ub-critical', 'High':'ub-high', 'Medium':'ub-high', 'Low':'ub-low' };
  const widthMap = { 1:'33%', 2:'66%', 3:'100%' };
  const colorMap = { 1:'var(--green)', 2:'var(--amber)', 3:'var(--red)' };

  el.innerHTML = `
    <div style="animation:fadeUp .3s ease">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:500;color:var(--text)">${ticket.user}</div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:10px;color:var(--text3);font-family:monospace">${ticket.id}</span>
          ${r._isRealAI