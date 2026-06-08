// ══════════════════════════════════════
// BUSTLER PULSE — TICKETS.JS
// Ticket list, filters, search, detail panel, resolve
// ══════════════════════════════════════

let currentFilter = 'all';
let currentSearch = '';
let selectedTicket = null;

// ── HELPER FUNCTIONS ──
function getTagClass(category) {
  const map = {
    'Bug Report':       'tag-bug',
    'User Confusion':   'tag-confusion',
    'Feature Feedback': 'tag-feedback',
    'Dispute':          'tag-dispute',
    'General Issue':    'tag-confusion'
  };
  return map[category] || 'tag-confusion';
}

function getUrgencyClass(urgency) {
  if (urgency === 'Critical') return 'ub-critical';
  if (urgency === 'High' || urgency === 'Medium') return 'ub-high';
  return 'ub-low';
}

function getStatusClass(status) {
  if (status === 'open')     return 'st-open';
  if (status === 'progress') return 'st-progress';
  return 'st-resolved';
}

function getStatusLabel(status) {
  if (status === 'open')     return 'Open';
  if (status === 'progress') return 'In Progress';
  return 'Resolved';
}

function getCardUrgencyClass(score) {
  if (score === 3) return 'urgent';
  if (score === 2) return 'medium';
  return 'low';
}

// ── RENDER TICKET LIST ──
function renderTickets() {
  const list = document.getElementById('tickets-list');
  if (!list) return;

  // Apply filters
  let filtered = [...TICKETS];

  if (currentFilter === 'open')     filtered = filtered.filter(t => t.status === 'open');
  if (currentFilter === 'progress') filtered = filtered.filter(t => t.status === 'progress');
  if (currentFilter === 'resolved') filtered = filtered.filter(t => t.status === 'resolved');
  if (currentFilter === 'urgent')   filtered = filtered.filter(t => t.urgency_score === 3);
  if (currentFilter === 'dispute')  filtered = filtered.filter(t => t.route === 'dispute');

  // Apply search
  if (currentSearch) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(currentSearch) ||
      t.user.toLowerCase().includes(currentSearch) ||
      t.category.toLowerCase().includes(currentSearch)
    );
  }

  // Show empty state
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty">
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="5" y="5" width="30" height="30" rx="4"/>
          <path d="M13 20h14M13 14h14M13 26h8"/>
        </svg>
        No tickets found
      </div>`;
    return;
  }

  // Render ticket cards
  list.innerHTML = filtered.map(t => `
    <div class="ticket-card ${getCardUrgencyClass(t.urgency_score)}" onclick="openDetail('${t.id}')">
      <div class="tc-id">${t.id}</div>
      <div class="tc-body">
        <div class="tc-title">${t.title}</div>
        <div class="tc-preview">${t.message.substring(0, 80)}...</div>
        <div class="tc-user">👤 ${t.user}</div>
      </div>
      <span class="tag ${getTagClass(t.category)}">${t.category}</span>
      <span class="urgency-badge ${getUrgencyClass(t.urgency)}">${t.urgency}</span>
      <div class="tc-meta">
        <span class="status-tag ${getStatusClass(t.status)}">${getStatusLabel(t.status)}</span>
        <span class="tc-time">${t.time}</span>
        <span class="tc-agent">${t.agent}</span>
      </div>
    </div>
  `).join('');
}

// ── FILTER TICKETS ──
function filterTickets(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTickets();
}

// ── SEARCH TICKETS ──
function searchTickets(val) {
  currentSearch = val.toLowerCase();
  renderTickets();
}

// ── OPEN TICKET DETAIL PANEL ──
function openDetail(id) {
  selectedTicket = TICKETS.find(t => t.id === id);
  if (!selectedTicket) return;

  const t = selectedTicket;

  document.getElementById('dp-id').textContent    = t.id + ' · ' + t.time;
  document.getElementById('dp-title').textContent = t.title;

  document.getElementById('dp-tags').innerHTML =
    `<span class="tag ${getTagClass(t.category)}">${t.category}</span>` +
    `<span class="urgency-badge ${getUrgencyClass(t.urgency)}">${t.urgency}</span>` +
    `<span class="status-tag ${getStatusClass(t.status)}">${getStatusLabel(t.status)}</span>`;

  document.getElementById('dp-message').textContent = t.message;

  document.getElementById('dp-details').innerHTML = `
    <div class="dp-info-row"><span class="dp-info-key">User</span><span class="dp-info-val">${t.user}</span></div>
    <div class="dp-info-row"><span class="dp-info-key">Assigned to</span><span class="dp-info-val">${t.agent}</span></div>
    <div class="dp-info-row"><span class="dp-info-key">Category</span><span class="dp-info-val">${t.category}</span></div>
    <div class="dp-info-row"><span class="dp-info-key">Urgency</span><span class="dp-info-val">${t.urgency}</span></div>
    <div class="dp-info-row"><span class="dp-info-key">Received</span><span class="dp-info-val">${t.time}</span></div>
  `;

  document.getElementById('detail-overlay').classList.add('show');
}

// ── CLOSE DETAIL PANEL ──
function closeDetail(e) {
  if (e.target === document.getElementById('detail-overlay')) {
    closeDetailPanel();
  }
}

function closeDetailPanel() {
  document.getElementById('detail-overlay').classList.remove('show');
}

// ── RESOLVE TICKET ──
function resolveTicket() {
  if (!selectedTicket) return;

  selectedTicket.status = 'resolved';

  // Calculate realistic response time and satisfaction
  const timeTaken    = parseFloat((Math.random() * 5 + 1).toFixed(1));
  const satisfaction = parseFloat((Math.random() * 1 + 4).toFixed(1));

  // Update agent profile tracker
  updateAgentOnResolve(selectedTicket.agent, selectedTicket.category, timeTaken, satisfaction);
  // Write-back to Anjali and Adhilekshmi layers
  writeResolvedTicket(selectedTicket, timeTaken, satisfaction);
  showWritebackStatus(selectedTicket.id);

  // Log activity in agent page
  logActivity(selectedTicket.agent, selectedTicket.id, selectedTicket.title, selectedTicket.category, satisfaction);

  // Update dashboard stat numbers
  const open     = TICKETS.filter(t => t.status === 'open' || t.status === 'progress').length;
  const resolved = TICKETS.filter(t => t.status === 'resolved').length;

  document.getElementById('s-open').textContent     = open;
  document.getElementById('s-resolved').textContent = resolved;
  document.getElementById('nb-open').textContent     = open;
  document.getElementById('nb-resolved').textContent = resolved;
  // Send resolution back to backend
  sendResolutionToBackend(selectedTicket);
  closeDetailPanel();
  renderTickets();
  renderDashboard();

  alert(
    '✓ Ticket ' + selectedTicket.id + ' resolved!\n' +
    '→ ' + selectedTicket.agent + '\'s profile updated\n' +
    '→ Activity logged\n' +
    '→ Report sent to Adhilekshmi\'s Intelligence Layer'
  );
}

// ── ESCALATE TICKET ──
function escalateTicket() {
  if (!selectedTicket) return;
  selectedTicket.route  = 'dispute';
  selectedTicket.status = 'progress';
  closeDetailPanel();
  renderTickets();
  alert('⚡ Ticket escalated to Dispute Center and assigned to Anjali P Remesh.');
}

// ── RENDER DASHBOARD RECENT TICKETS + BREAKDOWN ──
function renderDashboard() {
  // Recent tickets list
  const recent = document.getElementById('dash-recent');
  if (recent) {
    recent.innerHTML = TICKETS.slice(0, 5).map(t => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer"
           onclick="openDetail('${t.id}')">
        <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${
          t.urgency_score === 3 ? 'var(--red)' :
          t.urgency_score === 2 ? 'var(--amber)' : 'var(--green)'
        }"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
          <div style="font-size:11px;color:var(--text3)">${t.user} · ${t.category}</div>
        </div>
        <span class="status-tag ${getStatusClass(t.status)}" style="font-size:10px">${getStatusLabel(t.status)}</span>
      </div>
    `).join('');
  }

  // Issue breakdown bars
  const breakdown = document.getElementById('breakdown-chart');
  if (breakdown) {
    const cats   = ['Bug Report', 'User Confusion', 'Dispute', 'Feature Feedback'];
    const colors = ['var(--red)', 'var(--blue)', 'var(--amber)', 'var(--green)'];
    const counts = cats.map(c => TICKETS.filter(t => t.category === c).length);
    const max    = Math.max(...counts, 1);

    breakdown.innerHTML = cats.map((c, i) => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
          <span style="color:var(--text2)">${c}</span>
          <span style="color:${colors[i]};font-weight:500">${counts[i]}</span>
        </div>
        <div class="track">
          <div class="track-fill" style="width:${(counts[i] / max * 100)}%;background:${colors[i]}"></div>
        </div>
      </div>
    `).join('');
  }
}