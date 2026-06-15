// ══════════════════════════════════════
// BUSTLER PULSE — HEALTH.JS
// System Health Page
// ══════════════════════════════════════
async function renderHealth() {
  try {
    const res = await fetch('https://bustler-pulse.onrender.com/health/');
    const healthIssues = await res.json();

    // Update stats
    document.getElementById('h-active').textContent =
      healthIssues.filter(i => i.status !== 'resolved').length;
    document.getElementById('h-fixing').textContent =
      healthIssues.filter(i => i.status === 'fixing').length;
    document.getElementById('h-watching').textContent =
      healthIssues.filter(i => i.status === 'watching').length;
    document.getElementById('h-resolved').textContent =
      healthIssues.filter(i => i.status === 'resolved').length;

    const statusConfig = {
      fixing:   { label: '🔧 Fixing',   color: 'var(--amber)' },
      watching: { label: '👀 Watching', color: 'var(--blue)'  },
      resolved: { label: '✅ Resolved', color: 'var(--green)' }
    };

    const severityConfig = {
      low:      { label: '🟢 Low',      color: 'var(--green)' },
      medium:   { label: '🟡 Medium',   color: 'var(--amber)' },
      high:     { label: '🔴 High',     color: 'var(--red)'   },
      critical: { label: '🚨 Critical', color: 'var(--red)'   }
    };

    const list = document.getElementById('health-list');

    if (!healthIssues.length) {
      list.innerHTML = `
        <div style="text-align:center;padding:32px;color:var(--text3);font-size:13px">
          ✅ All systems operational — no known issues
        </div>`;
      return;
    }

    list.innerHTML = healthIssues.map(issue => {
      const s  = statusConfig[issue.status]     || statusConfig.watching;
      const sv = severityConfig[issue.severity] || severityConfig.low;
      const timeAgo = getTimeAgo(issue.created_at);

      return `
        <div style="background:var(--bg3);border-radius:10px;padding:16px 18px;
                    margin-bottom:10px;border-left:3px solid ${s.color}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="font-size:14px;font-weight:500;color:var(--text1)">${issue.title}</span>
                <span style="font-size:11px;padding:2px 8px;border-radius:4px;
                             background:var(--bg2);color:${sv.color}">${sv.label}</span>
              </div>
              <div style="font-size:13px;color:var(--text2);margin-bottom:8px">${issue.description}</div>
              <div style="font-size:11px;color:var(--text3)">Reported ${timeAgo}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-left:16px;align-items:flex-end">
              <span style="font-size:12px;color:${s.color};font-weight:500">${s.label}</span>
            </div>
          </div>
        </div>`;
    }).join('');

  } catch(e) {
    document.getElementById('health-list').innerHTML = `
      <div style="text-align:center;padding:32px;color:var(--text3);font-size:13px">
        ✅ All systems operational
      </div>`;
    document.getElementById('h-active').textContent = '0';
    document.getElementById('h-fixing').textContent = '0';
    document.getElementById('h-watching').textContent = '0';
    document.getElementById('h-resolved').textContent = '0';
  }
}
function getTimeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 60)   return diff + 'm ago';
  if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
  return Math.floor(diff / 1440) + 'd ago';
}

function showAddIssueForm() {
  document.getElementById('health-form').style.display = 'block';
}

function hideAddIssueForm() {
  document.getElementById('health-form').style.display = 'none';
  document.getElementById('h-title').value = '';
  document.getElementById('h-desc').value  = '';
}

async function addIssue() {
  const title = document.getElementById('h-title').value.trim();
  const desc  = document.getElementById('h-desc').value.trim();
  const sev   = document.getElementById('h-severity').value;

  if (!title) {
    alert('Please enter an issue title');
    return;
  }

  try {
    const res = await fetch('https://bustler-pulse.onrender.com/health/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:       title,
        description: desc,
        status:      'watching',
        severity:    sev
      })
    });

    if (res.ok) {
      hideAddIssueForm();
      renderHealth(); // refresh the list
    } else {
      alert('Failed to add issue. Try again.');
    }

  } catch(e) {
    alert('Could not connect to backend: ' + e.message);
  }
}
function updateIssueStatus(id, newStatus) {
  const issue = healthIssues.find(i => i.id === id);
  if (issue) {
    issue.status = newStatus;
    renderHealth();
  }
}

function deleteIssue(id) {
  healthIssues = healthIssues.filter(i => i.id !== id);
  renderHealth();
}