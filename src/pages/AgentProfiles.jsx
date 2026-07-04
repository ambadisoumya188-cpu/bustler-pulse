import { useMemo } from 'react';
import { INITIAL_AGENTS } from '../data/dummy.js';

function getSpeciality(categories) {
  if (Object.keys(categories).length === 0) return 'Not yet determined';
  return Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0];
}

function getScorePercent(resolved, satisfaction) {
  if (resolved === 0) return 0;
  const satAvg = satisfaction.length ? satisfaction.reduce((a, b) => a + b, 0) / satisfaction.length : 3;
  return Math.min(100, (resolved * 10) + (satAvg * 10));
}

export default function AgentProfiles({ ticketStore }) {
  const { tickets } = ticketStore;

  const agentStats = useMemo(() => {
    const stats = {};
    Object.entries(INITIAL_AGENTS).forEach(([name, data]) => {
      stats[name] = { ...data, resolved: 0, categories: {}, satisfaction: [], totalTime: 0 };
    });
    tickets.filter(t => t.status === 'resolved').forEach(t => {
      if (!stats[t.agent]) return;
      stats[t.agent].resolved++;
      stats[t.agent].categories[t.category] = (stats[t.agent].categories[t.category] || 0) + 1;
    });
    return stats;
  }, [tickets]);

  const leaderboard = Object.entries(agentStats).sort((a, b) => b[1].resolved - a[1].resolved);
  const totalResolved = leaderboard.reduce((s, [, d]) => s + d.resolved, 0);
  const medals = ['🥇', '🥈', '🥉', '4️⃣'];

  return (
    <div className="page active">
      <div className="agents-grid">
        {Object.entries(agentStats).map(([name, a]) => (
          <div key={name} className="agent-card">
            <div className="ac-top">
              <div className="ac-av" style={{ background: a.dimColor, color: a.color, border: `1px solid ${a.borderColor}` }}>
                {a.initials}
              </div>
              <div>
                <div className="ac-name">{name}</div>
                <div className="ac-role">{a.role}</div>
              </div>
            </div>

            <div className="ac-stat">
              <span className="ac-key">Tickets resolved</span>
              <span className="ac-val" style={{ color: a.resolved > 0 ? 'var(--green)' : 'var(--text)' }}>{a.resolved}</span>
            </div>
            <div className="ac-stat">
              <span className="ac-key">Avg response time</span>
              <span className="ac-val">—</span>
            </div>
            <div className="ac-stat">
              <span className="ac-key">Satisfaction score</span>
              <span className="ac-val">—</span>
            </div>
            <div className="ac-stat">
              <span className="ac-key">Status</span>
              <span className="ac-val" style={{ color: 'var(--green)' }}>● Online</span>
            </div>

            <div className="spec-tag">{getSpeciality(a.categories)}</div>

            <div className="score-track">
              <div className="score-fill" style={{ width: `${getScorePercent(a.resolved, a.satisfaction)}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-title">Resolution Activity Feed</div>
          {tickets.filter(t => t.status === 'resolved').length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>
              No activity yet — resolve a ticket to see it here
            </div>
          ) : tickets.filter(t => t.status === 'resolved').slice(0, 10).map(t => {
            const a = INITIAL_AGENTS[t.agent] || {};
            return (
              <div key={t.id} className="activity-item">
                <div className="act-av" style={{ background: a.dimColor || 'var(--gdim)', color: a.color || 'var(--green)', border: `1px solid ${a.borderColor || 'var(--gborder)'}` }}>
                  {a.initials || '?'}
                </div>
                <div className="act-body">
                  <div className="act-title">
                    <strong style={{ color: a.color || 'var(--green)' }}>{(t.agent || '').split(' ')[0]}</strong>
                    {' '}resolved{' '}
                    <em style={{ color: 'var(--text)' }}>{t.title}</em>
                    <span className={`act-tag tag-${t.route || 'bug'}`}>{t.category}</span>
                  </div>
                  <div className="act-meta">{t.id} · {t.time}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-title">🏆 Leaderboard</div>
          {leaderboard.filter(([, d]) => d.resolved > 0).map(([name, data], i) => (
            <div key={name} className="lb-item">
              <span className="lb-rank">{medals[i] || i + 1}</span>
              <div className="lb-av" style={{ background: data.dimColor, color: data.color, border: `1px solid ${data.borderColor}` }}>
                {data.initials}
              </div>
              <span className="lb-name">{name.split(' ')[0]}</span>
              <span className="lb-count">{data.resolved}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div className="card-title">Team Stats</div>
            <div className="grid2" style={{ gap: 8 }}>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--green)' }}>{totalResolved}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Total resolved</div>
              </div>
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--blue)' }}>—</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Avg satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}