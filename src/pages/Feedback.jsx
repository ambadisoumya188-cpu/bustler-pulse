import { useState, useEffect } from 'react';

export default function Feedback() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://bustler-pulse.onrender.com/feedback/')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scores   = data.map(f => f.csat_score).filter(Boolean);
  const avg      = scores.length ? (scores.reduce((a,b) => a+b, 0) / scores.length).toFixed(1) : '—';
  const positive = scores.filter(s => s >= 4).length;
  const negative = scores.filter(s => s <= 2).length;

  return (
    <div className="page active">
      <div className="stats-row">
        <div className="stat"><div className="stat-label">Total Responses</div><div className="stat-val">{data.length||'—'}</div><div className="stat-sub">from users</div></div>
        <div className="stat"><div className="stat-label">Avg Rating</div><div className="stat-val">{avg}</div><div className="stat-sub up">out of 5</div></div>
        <div className="stat"><div className="stat-label">Positive</div><div className="stat-val">{positive||'—'}</div><div className="stat-sub up">😊 happy users</div></div>
        <div className="stat"><div className="stat-label">Needs Attention</div><div className="stat-val">{negative||'—'}</div><div className="stat-sub warn">⚠️ low scores</div></div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="card-title">User Feedback</div>
        {loading ? (
          <div style={{textAlign:'center',padding:32,color:'var(--text3)'}}>Loading feedback...</div>
        ) : data.length === 0 ? (
          <div style={{textAlign:'center',padding:32,color:'var(--text3)'}}>⭐ No feedback yet</div>
        ) : data.map((f, i) => (
          <div key={i} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:12,padding:'18px 20px',marginBottom:12,display:'flex',gap:16}}>
            <div style={{width:38,height:38,borderRadius:'50%',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,flexShrink:0,color:'var(--text)'}}>
              {(f.user||'?').charAt(0).toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontWeight:500,fontSize:14,color:'var(--text)'}}>{f.user||'Anonymous'}</span>
                <span style={{color:'var(--text3)',fontSize:12}}>{f.created_at?new Date(f.created_at).toLocaleDateString():''}</span>
              </div>
              <div style={{fontSize:14,marginBottom:6}}>{'⭐'.repeat(f.csat_score||0)}</div>
              <div style={{color:'var(--text2)',fontSize:13}}>{f.comment||''}</div>
              {f.tag&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:'var(--gdim)',color:'var(--green)',marginTop:6,display:'inline-block'}}>{f.tag}</span>}
              <div style={{color:'var(--text3)',fontSize:11,marginTop:6}}>Ticket #{f.ticket_id}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}