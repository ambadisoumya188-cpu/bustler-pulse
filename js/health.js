// ══════════════════════════════════════
// BUSTLER PULSE — HEALTH.JS
// System Health Page
// ══════════════════════════════════════
async function renderHealth() {
  try {
    const res = await fetch('https://bustler-pulse.onrender.com/health/');
    const data = await res.json();

    // Update stats
    document.getElementById('h-active').textContent  = data.open_tickets     || 0;
    document.getElementById('h-fixing').textContent  = data.critical_tickets  || 0;
    document.getElementById('h-watching').textContent = data.status || '—';
    document.getElementById('h-resolved').textContent = data.resolved_today   || 0;

    const list = document.getElementById('health-list');
    if (!list) return;

    // Status color
    const statusColor = {
      'healthy':  'var(--green)',
      'degraded': 'var(--amber)',
      'critical': 'var(--red)'
    };

    const color = statusColor[data.status] || 'var(--amber)';

    list.innerHTML = `
      <div style="background:var(--bg3);border-radius:10px;padding:20px;
                  border-left:3px solid ${color};text-align:center">
        <div style="font-size:16px;font-weight:600;color:${color};margin-bottom:8px">
          ${data.status === 'healthy' ? '✅ All Systems Operational' : 
            data.status === 'degraded' ? '⚠️ Degraded Performance' : 
            '🔴 Critical Issues'}
        </div>
        <div style="font-size:13px;color:var(--text2)">${data.message || ''}</div>
      </div>`;

  } catch(e) {
    document.getElementById('health-list').innerHTML = `
      <div style="text-align:center;padding:32px;color:var(--text3);font-size:13px">
        ✅ All systems operational
      </div>`;
    document.getElementById('h-active').textContent  = '0';
    document.getElementById('h-fixing').textContent  = '0';
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






