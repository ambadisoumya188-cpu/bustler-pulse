export default function Dashboard({ ticketStore, setPage }) {
  const { tickets } = ticketStore;

  const open     = tickets.filter(t => t.status === 'open' || t.status === 'progress').length;
  const resolved = tickets.filter(t => t.status === 'resolved').length;

  const sorted = [...tickets].sort((a, b) => {
    const na = parseInt((a.id || '0').toString().replace(/\D/g, ''));
    const nb = parseInt((b.id || '0').toString().replace(/\D/g, ''));
    return nb - na;
  });

  const cats   = ['Bug Report', 'User Confusion', 'Dispute', 'Feature Feedback'];
  const colors = ['var(--red)', 'var(--blue)', 'var(--amber)', 'var(--green)'];
  const counts = cats.map(c => tickets.filter(t => t.category === c).length);
  const max    = Math.max(...counts, 1);

  const statusClass = s => s === 'open' ? 'st-open' : s === 'progress' ? 'st-progress' : 'st-resolved';
  const statusLabel = s => s === 'open' ? 'Open' : s === 'progress' ? 'In Progress' : 'Resolved';

  return (
    <div className="page active">
      <div className="stats-row">
        <div className="stat">
          <div className="stat-label">Open Tickets</div>
          <div className="stat-val">{open}</div>
          <div className="stat-sub warn">needs attention</div>
        </div>
        <div className="stat">
          <div className="stat-label">Resolved Today</div>
          <div className="stat-val">{resolved}</div>
          <div className="stat-sub up">✓ resolved</div>
        </div>
        <div className="stat">
          <div className="stat-label">Avg Response Time</div>
          <div className="stat-val">3.4<span style={{fontSize:14,color:'var(--text3)'}}>h</span></div>
          <div className="stat-sub up">↓ 1.2h improvement</div>
        </div>
        <div className="stat">
          <div className="stat-label">Satisfaction Score</div>
          <div className="stat-val">4.7<span style={{fontSize:14,color:'var(--text3)'}}>/5</span></div>
          <div className="stat-sub up">↑ 0.3 this week</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-title">Recent Tickets</div>
          {sorted.slice(0, 5).map(t => (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)',cursor:'pointer'}} onClick={() => setPage('tickets')}>
              <div style={{width:8,height:8,borderRadius:'50%',flexShrink:0,background:t.urgency_score===3?'var(--red)':t.urgency_score===2?'var(--amber)':'var(--green)'}}></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{t.user} · {t.category}</div>
              </div>
              <span className={`status-tag ${statusClass(t.status)}`} style={{fontSize:10}}>{statusLabel(t.status)}</span>
            </div>
          ))}
          <button className="ftab" style={{width:'100%',marginTop:10,textAlign:'center'}} onClick={() => setPage('tickets')}>
            View all tickets →
          </button>
        </div>

        <div className="card">
          <div className="card-title">Issue Breakdown</div>
          {cats.map((c, i) => (
            <div key={c} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                <span style={{color:'var(--text2)'}}>{c}</span>
                <span style={{color:colors[i],fontWeight:500}}>{counts[i]}</span>
              </div>
              <div className="track">
                <div className="track-fill" style={{width:`${counts[i]/max*100}%`,background:colors[i]}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}