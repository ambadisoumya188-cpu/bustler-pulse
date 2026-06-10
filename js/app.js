// ══════════════════════════════════════
// BUSTLER PULSE — APP.JS
// Main controller + fetch real tickets from backend
// ══════════════════════════════════════

const BACKEND_URL = 'https://bustler-pulse.onrender.com';

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
      // Real tickets go first, dummy tickets fill the rest
      realTickets.forEach(realTicket => {
        const exists = TICKETS.find(t => t._backend_id === realTicket._backend_id);
        if (!exists) {
          TICKETS.unshift(realTicket);
        }
      });

      // Update stats
      const openCount = TICKETS.filter(t => t.status === 'open' || t.status === 'progress').length;
      const nbOpen    = document.getElementById('nb-open');
      const sOpen     = document.getElementById('s-open');
      if (nbOpen) nbOpen.textContent = openCount;
      if (sOpen)  sOpen.textContent  = openCount;

      // Re-render
      renderTickets();
      renderDashboard();

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
    pill.style.background = 'var(--gdim)';
    pill.style.color      = 'var(--green)';
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
    feedback: 'User Feedback',
  };
  const subs = {
    dashboard: "Welcome back, Ambadi — here's today's overview",
    tickets:   'Manage and resolve incoming user tickets',
    triage:    'Complaints arrive automatically — AI classifies and routes them',
    agents:    'Live performance profiles — updates every time a ticket is resolved',
    feedback: 'Ratings and comments submitted by users after resolution',
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
  if (name === 'feedback') renderFeedback();
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
// Fetch new tickets every 30 seconds automatically
function startAutoRefresh() {
  setInterval(() => {
    fetchRealTickets();
  }, 30000);
}

// ── INITIALISE APP ──
function initApp() {
   loadAgentStats();
  // Load saved theme
  const savedTheme = localStorage.getItem('bustler-theme') || 'dark';
  setTheme(savedTheme);

  // Render with dummy data first
  renderAgentCards();
  renderTickets();
  renderDashboard();
  renderIncomingQueue();

  // Then fetch real tickets from backend
  fetchRealTickets();

  // Auto refresh every 30 seconds
  startAutoRefresh();
}

// Run when page loads
window.addEventListener('DOMContentLoaded', initApp);
// ─── FEEDBACK PAGE ───────────────────────────────────────
async function renderFeedback() {
  const container = document.getElementById('page-feedback');
  container.innerHTML = `<div style="padding:28px 32px;color:#9a9da6;">Loading feedback...</div>`;

  let feedbackData = [];
  let stats = { avg_csat: 0, total: 0 };

 try {
    const [feedRes, statsRes] = await Promise.all([
      fetch('https://bustler-pulse.onrender.com/feedback/'),
      fetch('https://bustler-pulse.onrender.com/feedback/summary/stats')
    ]);
    if (!feedRes.ok || !statsRes.ok) throw new Error('API not ready');
    feedbackData = await feedRes.json();
    stats = await statsRes.json();
  } catch (e) {
    console.log('Feedback API not available, using dummy data');
    feedbackData = [
      { id:1, user:"Rahul M.", ticket_id:1, csat_score:5, tag:"Fast response", comment:"Issue resolved within minutes!", created_at:"2026-06-08" },
      { id:2, user:"Sneha K.", ticket_id:2, csat_score:4, tag:"Helpful", comment:"Agent was polite and solved my problem.", created_at:"2026-06-07" },
      { id:3, user:"Arjun P.", ticket_id:3, csat_score:3, tag:"Average", comment:"Took a bit long but resolved.", created_at:"2026-06-07" },
      { id:4, user:"Priya R.", ticket_id:4, csat_score:5, tag:"Excellent", comment:"Best support experience ever!", created_at:"2026-06-06" },
      { id:5, user:"Kiran T.", ticket_id:5, csat_score:2, tag:"Slow", comment:"Waited too long for a response.", created_at:"2026-06-06" },
    ];
    stats = { avg_csat: 3.8, total: 5 };
  }

  if (!Array.isArray(feedbackData)) feedbackData = [];

  const avg = stats.avg_csat ? parseFloat(stats.avg_csat).toFixed(1) : 
    feedbackData.length ? (feedbackData.reduce((s,f) => s + f.csat_score, 0) / feedbackData.length).toFixed(1) : '0.0';
  const total = stats.total || feedbackData.length;
  const five  = feedbackData.filter(f => f.csat_score === 5).length;
  const four  = feedbackData.filter(f => f.csat_score === 4).length;
  const three = feedbackData.filter(f => f.csat_score <= 3).length;

  const stars = r => '⭐'.repeat(r) + '☆'.repeat(5 - r);

  const tagColor = tag => {
    if (!tag) return 'color:#9a9da6;background:rgba(255,255,255,0.05);';
    if (tag === 'Fast response' || tag === 'Excellent') return 'color:#22c984;background:rgba(34,201,132,0.1);';
    if (tag === 'Helpful') return 'color:#4e9eff;background:rgba(78,158,255,0.1);';
    if (tag === 'Slow') return 'color:#f05252;background:rgba(240,82,82,0.1);';
    return 'color:#f5a623;background:rgba(245,166,35,0.1);';
  };

  const formatDate = d => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  };

  container.innerHTML = `
    <div style="padding:28px 32px;">
      <h2 style="font-size:20px;font-weight:600;margin-bottom:6px;">User Feedback</h2>
      <p style="color:#9a9da6;font-size:13px;margin-bottom:24px;">Ratings submitted by users after ticket resolution</p>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px;">
        <div style="background:#16181c;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;">
          <div style="font-size:32px;font-weight:700;color:#22c984;">${avg}</div>
          <div style="color:#9a9da6;font-size:13px;margin-top:4px;">Average CSAT Score</div>
          <div style="margin-top:8px;font-size:18px;">${'⭐'.repeat(Math.round(avg))}</div>
        </div>
        <div style="background:#16181c;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;">
          <div style="font-size:32px;font-weight:700;color:#f0f0f0;">${total}</div>
          <div style="color:#9a9da6;font-size:13px;margin-top:4px;">Total Reviews</div>
          <div style="margin-top:8px;font-size:13px;color:#5c5f6a;">from resolved tickets</div>
        </div>
        <div style="background:#16181c;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;">
          <div style="font-size:13px;color:#9a9da6;margin-bottom:8px;">Rating Breakdown</div>
          <div style="font-size:12px;color:#f0f0f0;">⭐⭐⭐⭐⭐ <span style="color:#22c984;">${five} reviews</span></div>
          <div style="font-size:12px;color:#f0f0f0;margin-top:4px;">⭐⭐⭐⭐ <span style="color:#4e9eff;">${four} reviews</span></div>
          <div style="font-size:12px;color:#f0f0f0;margin-top:4px;">⭐⭐⭐ or below <span style="color:#f5a623;">${three} reviews</span></div>
        </div>
      </div>

      ${feedbackData.length === 0 ? `
        <div style="text-align:center;padding:40px;color:#5c5f6a;">No feedback yet</div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${feedbackData.map(f => `
            <div style="background:#16181c;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px 20px;display:flex;align-items:flex-start;gap:16px;">
              <div style="width:38px;height:38px;border-radius:50%;background:#1e2127;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;flex-shrink:0;">
                ${(f.user || '?').charAt(0).toUpperCase()}
              </div>
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap;">
                  <span style="font-weight:500;font-size:14px;">${f.user || 'Anonymous'}</span>
                  ${f.tag ? `<span style="font-size:11px;padding:2px 8px;border-radius:4px;${tagColor(f.tag)}">${f.tag}</span>` : ''}
                  <span style="color:#5c5f6a;font-size:12px;margin-left:auto;">${formatDate(f.created_at)}</span>
                </div>
                <div style="font-size:14px;margin-bottom:6px;">${stars(f.csat_score || 0)}</div>
                <div style="color:#9a9da6;font-size:13px;">${f.comment || ''}</div>
                <div style="color:#5c5f6a;font-size:11px;margin-top:6px;">Ticket #${f.ticket_id}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}