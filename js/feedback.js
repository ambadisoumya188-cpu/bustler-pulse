async function loadFeedback() {
  try {
    const res = await fetch('https://bustler-pulse.onrender.com/feedback/');
    const data = await res.json();

    // data might be an array or { results: [...] } — handle both
    const items = Array.isArray(data) ? data : (data.results || data.feedback || []);

    // Stats
    document.getElementById('fb-total').textContent = items.length;

    if (items.length > 0) {
      const ratings = items.map(f => Number(f.rating)).filter(r => !isNaN(r));
      if (ratings.length) {
        const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
        document.getElementById('fb-avg').textContent = avg;
        document.getElementById('fb-positive').textContent = ratings.filter(r => r >= 4).length;
        document.getElementById('fb-negative').textContent = ratings.filter(r => r <= 2).length;
      }
    }

    // Render cards
    const list = document.getElementById('feedback-list');
    if (!items.length) {
      list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);font-size:13px">No feedback yet.</div>';
      return;
    }

    list.innerHTML = items.map(f => `
      <div style="padding:14px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:13px;font-weight:500;color:var(--text1)">${f.user || f.name || 'Anonymous'}</span>
          <span style="font-size:12px;color:${getRatingColor(f.rating)}">
            ${'★'.repeat(Math.round(f.rating || 0))}${'☆'.repeat(5 - Math.round(f.rating || 0))} ${f.rating || '?'}/5
          </span>
        </div>
        <div style="font-size:13px;color:var(--text2);line-height:1.5">${f.message || f.comment || f.text || ''}</div>
        ${f.created_at ? `<div style="font-size:11px;color:var(--text3);margin-top:6px">${new Date(f.created_at).toLocaleDateString()}</div>` : ''}
      </div>
    `).join('');

  } catch (err) {
    document.getElementById('feedback-list').innerHTML =
      `<div style="text-align:center;padding:32px;color:var(--red);font-size:13px">Error loading feedback: ${err.message}</div>`;
  }
}

function getRatingColor(rating) {
  if (rating >= 4) return 'var(--green)';
  if (rating >= 3) return 'var(--amber)';
  return 'var(--red)';
}