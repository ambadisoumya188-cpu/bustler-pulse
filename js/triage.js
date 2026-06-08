// ══════════════════════════════════════
// BUSTLER PULSE — TRIAGE.JS
// AI Triage Engine — with demo mode fallback
// ══════════════════════════════════════

const API_URL = "https://api.anthropic.com/v1/messages";

let incomingQueue    = [...INCOMING];
let triageAutoCount  = 0;
let triageAngerCount = 0;
let triageTotal      = 0;

// ── DEMO MODE RESPONSES ──
const DEMO_RESPONSES = {
  'INC-001': {
    category: 'Bug Report', urgency: 'Critical', urgency_score: 3,
    anger_detected: true, route_to: 'Team Lead',
    auto_reply: 'We sincerely apologize for the login issue. This has been flagged as critical and a senior team member will contact you within 30 minutes. Please try using a different browser as a workaround.',
    summary: 'User cannot login — 404 error since last update',
    auto_resolvable: false
  },
  'INC-002': {
    category: 'User Confusion', urgency: 'Low', urgency_score: 1,
    anger_detected: false, route_to: 'Adhilekshmi R',
    auto_reply: 'Happy to help! To add a new skill, go to your profile, tap Edit Profile, scroll to Skills and tap the + button. Let us know if you need further help!',
    summary: 'User confused about how to add skills to profile',
    auto_resolvable: true
  },
  'INC-003': {
    category: 'Dispute', urgency: 'High', urgency_score: 2,
    anger_detected: false, route_to: 'Anjali P Remesh',
    auto_reply: 'Your dispute has been logged. Our resolution specialist will review the case and contact both parties within 24 hours with a fair resolution.',
    summary: 'Freelancer not responding — refund request of Rs.12000',
    auto_resolvable: false
  },
  'INC-004': {
    category: 'Bug Report', urgency: 'Critical', urgency_score: 3,
    anger_detected: true, route_to: 'Team Lead',
    auto_reply: 'We are very sorry about the app crash. This is a critical issue and our technical team is working on a fix right now. We will update you within 2 hours.',
    summary: 'App crashes when opening messages section — critical bug',
    auto_resolvable: false
  }
};

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
}

// ── PROCESS NEXT ──
async function processNext() {
  if (incomingQueue.length === 0) return;
  const ticket = incomingQueue[0];

  const btn = document.getElementById('process-all-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }
  const thinking = document.getElementById('triage-thinking');
  if (thinking) thinking.classList.add('show');

  let result = null;
  try {
    result = await callRealAI(ticket);
  } catch (e) {
    console.log('Real AI unavailable — using demo mode');
    result = getDemoResponse(ticket);
    await new Promise(resolve => setTimeout(resolve, 2000));
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

// ── CALL REAL AI ──
async function callRealAI(ticket) {
  const prompt = `You are the AI triage engine for Bustler Pulse. Analyze this complaint and respond ONLY in valid JSON:
{"category":"Bug Report"|"User Confusion"|"Feature Feedback"|"Dispute"|"General Issue","urgency":"Critical"|"High"|"Medium"|"Low","urgency_score":1|2|3,"anger_detected":true|false,"route_to":"Ambadi Sajan"|"Adhilekshmi R"|"Anjali P Remesh"|"Team Lead","auto_reply":"2-3 sentence reply","summary":"one sentence summary","auto_resolvable":true|false}
Routing: Bug→Ambadi, Confusion→Adhilekshmi, Dispute→Anjali, Feedback→Adhilekshmi, Critical/Angry→Team Lead.
User: ${ticket.user}. Message: "${ticket.msg}"`;

  const res  = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
  });
  const data   = await res.json();
  const raw    = data.content[0].text.replace(/```json|```/g, '').trim();
  const result = JSON.parse(raw);
  result._isRealAI = true;
  return result;
}

// ── GET DEMO RESPONSE ──
function getDemoResponse(ticket) {
  if (DEMO_RESPONSES[ticket.id]) return { ...DEMO_RESPONSES[ticket.id], _isRealAI: false };

  const msg        = ticket.msg.toLowerCase();
  const isAngry    = msg.includes('frustrated') || msg.includes('unacceptable') || msg.includes('terrible');
  const isBug      = msg.includes('error') || msg.includes('crash') || msg.includes('not working');
  const isDispute  = msg.includes('refund') || msg.includes('payment') || msg.includes('not responding');
  const isConfused = msg.includes('how') || msg.includes('cannot find') || msg.includes('where');

  if (isDispute)        return { category:'Dispute',          urgency:'High',     urgency_score:2, anger_detected:false,   route_to:'Anjali P Remesh', auto_reply:'Your dispute has been logged. Our specialist will contact both parties within 24 hours.', summary:'Dispute filed — routed to resolution center', auto_resolvable:false, _isRealAI:false };
  if (isAngry && isBug) return { category:'Bug Report',       urgency:'Critical', urgency_score:3, anger_detected:true,    route_to:'Team Lead',       auto_reply:'We sincerely apologize. Your complaint has been escalated and someone will contact you within 30 minutes.', summary:'Critical bug — angry user escalated', auto_resolvable:false, _isRealAI:false };
  if (isBug)            return { category:'Bug Report',       urgency:'High',     urgency_score:2, anger_detected:false,   route_to:'Ambadi Sajan',    auto_reply:'Thank you for reporting this. Our technical team has been notified and will update you within 2 hours.', summary:'Bug reported — assigned to technical agent', auto_resolvable:false, _isRealAI:false };
  if (isConfused)       return { category:'User Confusion',   urgency:'Low',      urgency_score:1, anger_detected:false,   route_to:'Adhilekshmi R',   auto_reply:'Happy to help! Our support team will guide you through this shortly.', summary:'User needs guidance — routed to support agent', auto_resolvable:true, _isRealAI:false };
  return               { category:'General Issue',           urgency:'Medium',   urgency_score:2, anger_detected:isAngry, route_to:'Ambadi Sajan',    auto_reply:'Thank you for contacting Bustler. A team member will respond within 3 hours.', summary:'General issue received — under review', auto_resolvable:false, _isRealAI:false };
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
            ? '<span style="font-size:10px;padding:2px 7px;background:var(--gdim);color:var(--green);border:1px solid var(--gborder);border-radius:10px">Real AI</span>'
            : '<span style="font-size:10px;padding:2px 7px;background:var(--bdim);color:var(--blue);border:1px solid rgba(78,158,255,.25);border-radius:10px">Demo Mode</span>'
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
      <div style="background:var(--bg3);border-left:3px solid var(--green);border-radius:0 8px 8px 0;padding:10px 12px;font-size:12px;color:var(--text2);line-height:1.6">${r.auto_reply}</div>
    </div>`;
}

// ── ADD TO TICKET LIST ──
function addProcessedTicket(ticket, result) {
  const routeMap = { 'Ambadi Sajan':'bug', 'Adhilekshmi R':'confusion', 'Anjali P Remesh':'dispute', 'Team Lead':'bug' };
  const newId = 'TKT-' + String(TICKETS.length + 1).padStart(3, '0');
  TICKETS.unshift({ id:newId, user:ticket.user, title:result.summary||ticket.msg.substring(0,50), message:ticket.msg, category:result.category, urgency:result.urgency, urgency_score:result.urgency_score, status:'open', agent:result.route_to, time:'Just now', route:routeMap[result.route_to]||'bug' });
  const openCount = TICKETS.filter(t => t.status==='open'||t.status==='progress').length;
  const nbOpen = document.getElementById('nb-open');
  const sOpen  = document.getElementById('s-open');
  if (nbOpen) nbOpen.textContent = openCount;
  if (sOpen)  sOpen.textContent  = openCount;
  renderTickets();
  renderDashboard();
}

// ── UPDATE STATS ──
function updateTriageStats() {
  const autoEl  = document.getElementById('t-auto');
  const angerEl = document.getElementById('t-anger');
  const totalEl = document.getElementById('t-queue-count');
  if (autoEl)  autoEl.textContent  = triageAutoCount;
  if (angerEl) angerEl.textContent = triageAngerCount;
  if (totalEl) totalEl.textContent = incomingQueue.length;
}