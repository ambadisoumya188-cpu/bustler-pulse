import { useState } from 'react';

const BACKEND_URL = 'https://bustler-pulse.onrender.com';
const getTagClass = c => ({'Bug Report':'tag-bug','User Confusion':'tag-confusion','Feature Feedback':'tag-feedback','Dispute':'tag-dispute','General Issue':'tag-confusion'}[c]||'tag-confusion');
const getUrgClass = u => u==='Critical'?'ub-critical':(u==='High'||u==='Medium')?'ub-high':'ub-low';
const getStClass  = s => s==='open'?'st-open':s==='progress'?'st-progress':'st-resolved';
const getStLabel  = s => s==='open'?'Open':s==='progress'?'In Progress':'Resolved';
const getCardUrg  = s => s===3?'urgent':s===2?'medium':'low';

export default function AllTickets({ ticketStore }) {
  const { tickets, resolveTicket, escalateTicket } = ticketStore;
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const sorted = [...tickets].sort((a, b) => {
    const na = parseInt((a.id||'0').toString().replace(/\D/g,''));
    const nb = parseInt((b.id||'0').toString().replace(/\D/g,''));
    return nb - na;
  });

  let filtered = sorted;
  if (filter==='open')     filtered = filtered.filter(t=>t.status==='open');
  if (filter==='progress') filtered = filtered.filter(t=>t.status==='progress');
  if (filter==='resolved') filtered = filtered.filter(t=>t.status==='resolved');
  if (filter==='urgent')   filtered = filtered.filter(t=>t.urgency_score===3);
  if (filter==='dispute')  filtered = filtered.filter(t=>t.route==='dispute');
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(t=>(t.title||'').toLowerCase().includes(s)||(t.user||'').toLowerCase().includes(s)||(t.category||'').toLowerCase().includes(s));
  }

  const handleResolve = async () => {
    if (!selected) return;
    await resolveTicket(selected);
    alert(`✓ Ticket ${selected.id} resolved!\n→ ${selected.agent}'s profile updated`);
    setSelected(null);
  };

  const handleEscalate = async () => {
    if (!selected) return;
    const ok = await escalateTicket(selected);
    if (ok) { alert('⚡ Ticket escalated to Anjali P Remesh.'); setSelected(null); }
  };

  return (
    <div className="page active">
      <div className="filter-bar">
        <div className="filter-tabs">
          {['all','open','progress','resolved','urgent','dispute'].map(f=>(
            <button key={f} className={`ftab${filter===f?' active':''}`} onClick={()=>setFilter(f)}>
              {f==='urgent'?'🔴 Urgent':f==='dispute'?'⚠️ Disputes':f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-box">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="4"/><path d="M9.5 9.5L12 12" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search tickets..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="tickets-grid">
        {filtered.length===0?(
          <div className="empty">
            <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="30" height="30" rx="4"/><path d="M13 20h14M13 14h14M13 26h8"/></svg>
            No tickets found
          </div>
        ):filtered.map(t=>(
          <div key={t.id} className={`ticket-card ${getCardUrg(t.urgency_score)}`} onClick={()=>setSelected(t)}>
            <div className="tc-id">{t.id}</div>
            <div className="tc-body">
              <div className="tc-title">{t.title}</div>
              <div className="tc-preview">{(t.message||'').substring(0,80)}...</div>
              <div className="tc-user">👤 {t.user}</div>
            </div>
            <span className={`tag ${getTagClass(t.category)}`}>{t.category}</span>
            <span className={`urgency-badge ${getUrgClass(t.urgency)}`}>{t.urgency}</span>
            <div className="tc-meta">
              <span className={`status-tag ${getStClass(t.status)}`}>{getStLabel(t.status)}</span>
              <span className="tc-time">{t.time}</span>
              <span className="tc-agent">{t.agent}</span>
            </div>
          </div>
        ))}
      </div>

      {selected&&(
        <div className="detail-overlay show" onClick={e=>{if(e.target.classList.contains('detail-overlay'))setSelected(null);}}>
          <div className="detail-panel">
            <div className="dp-close"><button onClick={()=>setSelected(null)}>✕ Close</button></div>
            <div className="dp-id">{selected.id} · {selected.time}</div>
            <div className="dp-title">{selected.title}</div>
            <div className="dp-tags">
              <span className={`tag ${getTagClass(selected.category)}`}>{selected.category}</span>
              <span className={`urgency-badge ${getUrgClass(selected.urgency)}`}>{selected.urgency}</span>
              <span className={`status-tag ${getStClass(selected.status)}`}>{getStLabel(selected.status)}</span>
            </div>
            <div className="dp-section">
              <div className="dp-section-label">User Message</div>
              <div className="dp-message">{selected.message}</div>
            </div>
            <div className="dp-section">
              <div className="dp-section-label">Ticket Details</div>
              <div>
                {[['User',selected.user],['Assigned to',selected.agent],['Category',selected.category],['Urgency',selected.urgency],['Received',selected.time]].map(([k,v])=>(
                  <div key={k} className="dp-info-row">
                    <span className="dp-info-key">{k}</span>
                    <span className="dp-info-val">{v}</span>
                  </div>
                ))}
                {selected.screenshot_url&&(
                  <div className="dp-info-row" style={{flexDirection:'column',alignItems:'flex-start',gap:8}}>
                    <span className="dp-info-key">Screenshot</span>
                    <img src={selected.screenshot_url.startsWith('http')?selected.screenshot_url:BACKEND_URL+selected.screenshot_url}
                      style={{maxWidth:'100%',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',marginTop:4,cursor:'pointer'}}
                      onClick={()=>window.open(selected.screenshot_url.startsWith('http')?selected.screenshot_url:BACKEND_URL+selected.screenshot_url,'_blank')}
                      alt="Screenshot"/>
                  </div>
                )}
              </div>
            </div>
            <div className="dp-actions">
              <button className="btn-resolve" onClick={handleResolve} disabled={selected.status==='resolved'}>✓ Mark as Resolved</button>
              {selected.status!=='resolved'&&selected.category!=='Dispute'&&!selected._escalated&&(
                <button className="btn-escalate" onClick={handleEscalate}>⚡ Escalate</button>
              )}
              <button className="btn-cancel" onClick={()=>setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}