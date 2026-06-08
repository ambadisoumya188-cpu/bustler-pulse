// ══════════════════════════════════════
// BUSTLER PULSE — AGENTS.JS
// Agent Profile Tracker, Leaderboard, Activity Feed
// ══════════════════════════════════════

// Activity log — stores every resolved ticket
let activityLog = [];
function loadAgentStats() {
  const saved = localStorage.getItem('bustler_agent_stats');
  if (saved) {
    const savedAgents = JSON.parse(saved);
    Object.keys(savedAgents).forEach(name => {
      if (AGENTS[name]) {
        AGENTS[name].resolved     = savedAgents[name].resolved || 0;
        AGENTS[name].categories   = savedAgents[name].categories || {};
        AGENTS[name].totalTime    = savedAgents[name].totalTime || 0;
        AGENTS[name].satisfaction = savedAgents[name].satisfaction || [];
      }
    });
  }
  const savedLog = localStorage.getItem('bustler_activity_log');
  if (savedLog) {
    activityLog = JSON.parse(savedLog);
  }
}
loadAgentStats();
// Load saved agent stats from localStorage on startup
function loadAgentStats() {
  const saved = localStorage.getItem('bustler_agent_stats');
  if (saved) {
    const savedAgents = JSON.parse(saved);
    Object.keys(savedAgents).forEach(name => {
      if (AGENTS[name]) {
        AGENTS[name].resolved     = savedAgents[name].resolved || 0;
        AGENTS[name].categories   = savedAgents[name].categories || {};
        AGENTS[name].totalTime    = savedAgents[name].totalTime || 0;
        AGENTS[name].satisfaction = savedAgents[name].satisfaction || [];
      }
    });
  }
}
loadAgentStats();

// ── HELPER FUNCTIONS ──
function getSpeciality(agent) {
  const cats = agent.categories;
  if (Object.keys(cats).length === 0) return 'Not yet determined';
  return Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0];
}

function getAvgTime(agent) {
  if (agent.resolved === 0) return '—';
  return (agent.totalTime / agent.resolved).toFixed(1) + 'h';
}

function getAvgSat(agent) {
  if (agent.satisfaction.length === 0) return '—';
  const avg = agent.satisfaction.reduce((a, b) => a + b, 0) / agent.satisfaction.length;
  return avg.toFixed(1) + '/5';
}

function getScorePercent(agent) {
  if (agent.resolved === 0) return 0;
  const satAvg = agent.satisfaction.length
    ? agent.satisfaction.reduce((a, b) => a + b, 0) / agent.satisfaction.length
    : 3;
  return Math.min(100, (agent.resolved * 10) + (satAvg * 10));
}

// ── RENDER AGENT CARDS ──
function renderAgentCards() {
  const grid = document.getElementById('agents-grid');
  if (!grid) return;

  grid.innerHTML = Object.entries(AGENTS).map(([name, a]) => `
    <div class="agent-card">

      <!-- Top row: avatar + name -->
      <div class="ac-top">
        <div class="ac-av" style="background:${a.dimColor};color:${a.color};border:1px solid ${a.borderColor}">
          ${a.initials}
        </div>
        <div>
          <div class="ac-name">${name}</div>
          <div class="ac-role">${a.role}</div>
        </div>
      </div>

      <!-- Stats -->
      <div class="ac-stat">
        <span class="ac-key">Tickets resolved</span>
        <span class="ac-val" style="color:${a.resolved > 0 ? 'var(--green)' : 'var(--text)'}">
          ${a.resolved}
        </span>
      </div>
      <div class="ac-stat">
        <span class="ac-key">Avg response time</span>
        <span class="ac-val">${getAvgTime(a)}</span>
      </div>
      <div class="ac-stat">
        <span class="ac-key">Satisfaction score</span>
        <span class="ac-val" style="color:${a.satisfaction.length ? 'var(--green)' : 'var(--text)'}">
          ${getAvgSat(a)}
        </span>
      </div>
      <div class="ac-stat">
        <span class="ac-key">Status</span>
        <span class="ac-val" style="color:var(--green)">● Online</span>
      </div>

      <!-- Speciality tag -->
      <div class="spec-tag">${getSpeciality(a)}</div>

      <!-- Performance bar -->
      <div class="score-track">
        <div class="score-fill" style="width:${getScorePercent(a)}%"></div>
      </div>

    </div>
  `).join('');
}

// ── RENDER LEADERBOARD ──
function renderLeaderboard() {
  const lb = document.getElementById('leaderboard');
  if (!lb) return;

  // Sort agents by resolved count
  const ranked = Object.entries(AGENTS)
    .filter(([, a]) => a.resolved > 0)
    .sort((a, b) => b[1].resolved - a[1].resolved);

  // No resolutions yet
  if (ranked.length === 0) {
    lb.innerHTML = `
      <div style="text-align:center;padding:16px;color:var(--text3);font-size:13px">
        No resolutions yet — resolve a ticket to see rankings
      </div>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣'];

  lb.innerHTML = ranked.map(([name, a], i) => `
    <div class="lb-item">
      <span class="lb-rank">${medals[i] || i + 1}</span>
      <div class="lb-av" style="background:${a.dimColor};color:${a.color};border:1px solid ${a.borderColor}">
        ${a.initials}
      </div>
      <span class="lb-name">${name.split(' ')[0]}</span>
      <span class="lb-count">${a.resolved}</span>
    </div>
  `).join('');

  // Update team stats
  const totalResolved = Object.values(AGENTS).reduce((s, a) => s + a.resolved, 0);
  const allSat        = Object.values(AGENTS).flatMap(a => a.satisfaction);
  const avgSat        = allSat.length
    ? (allSat.reduce((a, b) => a + b, 0) / allSat.length).toFixed(1) + '/5'
    : '—';

  const teamTotalEl = document.getElementById('team-total');
  const teamSatEl   = document.getElementById('team-sat');
  if (teamTotalEl) teamTotalEl.textContent = totalResolved;
  if (teamSatEl)   teamSatEl.textContent   = avgSat;
}

// ── RENDER ACTIVITY FEED ──
function renderActivityFeed() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  if (activityLog.length === 0) {
    feed.innerHTML = `
      <div style="text-align:center;padding:24px;color:var(--text3);font-size:13px">
        No activity yet — resolve a ticket to see it here
      </div>`;
    return;
  }

  const tagMap = {
    'Bug Report':       'tag-bug',
    'User Confusion':   'tag-confusion',
    'Feature Feedback': 'tag-feedback',
    'Dispute':          'tag-dispute',
    'General Issue':    'tag-confusion'
  };

  // Show newest first
  feed.innerHTML = activityLog.slice().reverse().map(log => {
    const agent = AGENTS[log.agent] || {};
    return `
      <div class="activity-item">
        <div class="act-av"
             style="background:${agent.dimColor || 'var(--gdim)'};
                    color:${agent.color || 'var(--green)'};
                    border:1px solid ${agent.borderColor || 'var(--gborder)'}">
          ${agent.initials || '?'}
        </div>
        <div class="act-body">
          <div class="act-title">
            <strong style="color:${agent.color || 'var(--green)'}">
              ${log.agent.split(' ')[0]}
            </strong>
            resolved
            <em style="color:var(--text)">${log.title}</em>
            <span class="act-tag ${tagMap[log.category] || 'tag-confusion'}">${log.category}</span>
          </div>
          <div class="act-meta">${log.ticketId} · ${log.time} · ⭐ ${log.sat}/5</div>
        </div>
      </div>
    `;
  }).join('');
}

// ── UPDATE AGENT STATS ON RESOLVE ──
// Called by tickets.js when a ticket is resolved
function updateAgentOnResolve(agentName, category, timeTaken, satisfaction) {
  const agent = AGENTS[agentName];
  if (!agent) return;
  agent.resolved++;
  agent.categories[category] = (agent.categories[category] || 0) + 1;
  agent.totalTime += timeTaken;
  agent.satisfaction.push(satisfaction);
  localStorage.setItem('bustler_agent_stats', JSON.stringify(AGENTS));

  // Save to localStorage so stats persist after refresh
  localStorage.setItem('bustler_agent_stats', JSON.stringify(AGENTS));

  renderAgentCards();
  renderLeaderboard();
}

// ── LOG ACTIVITY ──
// Called by tickets.js after every resolution
function logActivity(agentName, ticketId, title, category, sat) {
  activityLog.push({
    agent:    agentName,
    ticketId: ticketId,
    title:    title.length > 40 ? title.substring(0, 40) + '...' : title,
    category: category,
    sat:      sat,
    time:     new Date().toLocaleTimeString('en-IN', {
      hour:   '2-digit',
      minute: '2-digit'
    })
  });
  localStorage.setItem('bustler_activity_log', JSON.stringify(activityLog));

  // Refresh feed if agent page is currently open
  renderActivityFeed();
}