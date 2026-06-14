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
    feedback:  'User Feedback',
    health:    'System Health',
  };

  const subs = {
    dashboard: "Welcome back, Ambadi — here's today's overview",
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
function renderFeedback() {
  const c = document.getElementById('page-feedback');
  if (!c) return;
  c.innerHTML = '<div style="padding:28px;color:#9a9da6;">Loading...</div>';
  fetch('https://bustler-pulse.onrender.com/feedback/')
    .then(r => r.json())
    .then(data => {
      if (!data.length) {
        c.innerHTML = '<div style="padding:28px;text-align:center;color:#5c5f6a;font-size:14px;">⭐ No feedback yet</div>';
        return;
      }
      c.innerHTML = '<div style="padding:28px 32px;">' +
        data.map(f =>
          '<div style="background:#16181c;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px 20px;margin-bottom:12px;display:flex;gap:16px;">' +
            '<div style="width:38px;height:38px;border-radius:50%;background:#1e2127;display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0;">' +
              (f.user||'?').charAt(0).toUpperCase() +
            '</div>' +
            '<div style="flex:1;">' +
              '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                '<span style="font-weight:500;font-size:14px;">' + (f.user||'Anonymous') + '</span>' +
                '<span style="color:#5c5f6a;font-size:12px;">' + new Date(f.created_at).toLocaleDateString() + '</span>' +
              '</div>' +
              '<div style="font-size:14px;margin-bottom:6px;">' + '⭐'.repeat(f.csat_score||0) + '</div>' +
              '<div style="color:#9a9da6;font-size:13px;">' + (f.comment||'') + '</div>' +
              (f.tag ? '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(34,201,132,0.1);color:#22c984;margin-top:6px;display:inline-block;">' + f.tag + '</span>' : '') +
              '<div style="color:#5c5f6a;font-size:11px;margin-top:6px;">Ticket #' + f.ticket_id + '</div>' +
            '</div>' +
          '</div>'
        ).join('') +
      '</div>';
    })
    .catch(() => {
      c.innerHTML = '<div style="padding:28px;text-align:center;color:#5c5f6a;">Could not load feedback</div>';
    });
}

