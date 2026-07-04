import { useState } from 'react';

const BACKEND_URL = 'https://bustler-pulse.onrender.com';
const URGENCY_MAP = { critical:{urgency:'Critical',score:3}, high:{urgency:'High',score:2}, medium:{urgency:'Medium',score:2}, low:{urgency:'Low',score:1} };
const ROUTE_LABELS = { payment_team:'Payment Team', refund_team:'Refund Team', ops_agent:'Ops Agent', dispute_team:'Dispute Team' };
const tagMap  = {'Bug Report':'tag-bug','User Confusion':'tag-confusion','Feature Feedback':'tag-feedback','Dispute':'tag-dispute','General Issue':'tag-confusion'};
const urgMap  = {'Critical':'ub-critical','High':'ub-high','Medium':'ub-high','Low':'ub-low'};
const widthMap = {1:'33%',2:'66%',3:'100%'};
const colorMap = {1:'var(--green)',2:'var(--amber)',3:'var(--red)'};

function labelRouteTo(raw) {
  if (!raw) return null;
  if (ROUTE_LABELS[raw]) return ROUTE_LABELS[raw];
  return raw.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}

export default function AITriage({ ticketStore }) {
  const { incomingQueue, setIncomingQueue, tickets, resolveTicket, escalateTicket } = ticketStore;
  const [result, setResult] = useState(null);
  const [resultTicket, setResultTicket] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [autoCount, setAutoCount] = useState(()=>parseInt(localStorage.getItem('triage_auto')||'0'));
  const [angerCount, setAngerCount] = useState(()=>parseInt(localStorage.getItem('triage_anger')||'0'));

  const sorted = [...incomingQueue].sort((a,b)=>{
    const aA=a.anger_detected?1:0, bA=b.anger_detected?1:0;
    if(aA!==bA) return bA-aA;
    return (b.urgency_score||0)-(a.urgency_score||0);
  });

  async function getTriageResult(ticket) {
    if (ticket._triaged) {
      return { category:ticket.category||'General Issue', urgency:ticket.urgency||'Medium', urgency_score:ticket.urgency_score||2, anger_detected:!!ticket.anger_detected, route_to:ticket.route_to||'Unassigned', auto_reply:ticket.auto_reply||'No automatic reply was generated for this ticket.', auto_resolvable:!!ticket.auto_reply_sent, _isRealAI:true };
    }
    if (!ticket._backend_id) throw new Error('No backend id');
    const res = await fetch(BACKEND_URL+'/tickets/'+ticket._backend_id+'/triage',{method:'POST',headers:{'Content-Type':'application/json'}});
    if (!res.ok) throw new Error('Triage failed');
    const data = await res.json();
    const uInfo = URGENCY_MAP[(data.urgency||'medium').toLowerCase()]||URGENCY_MAP['medium'];
    return { category:ticket.category||'General Issue', urgency:uInfo.urgency, urgency_score:uInfo.score, anger_detected:data.is_anger_flagged===1, route_to:labelRouteTo(data.route_to)||'Unassigned', auto_reply:data.auto_reply||'No automatic reply was generated for this ticket.', auto_resolvable:data.auto_reply_sent===1, _isRealAI:true };
  }

  async function preview(ticket) {
    setPreviewId(ticket.id);
    let r;
    try { r = await getTriageResult(ticket); }
    catch { r = {category:'General Issue',urgency:'Medium',urgency_score:2,anger_detected:false,route_to:'Unassigned',auto_reply:'Triage service could not be reached.',auto_resolvable:false,_isRealAI:false}; }
    setResultTicket(ticket); setResult(r);
  }

  async function processNext() {
    if (sorted.length===0) return;
    const ticket = sorted[0];
    setProcessing(true); setThinking(true);
    let r;
    try {
      const [triageData] = await Promise.all([getTriageResult(ticket), new Promise(res=>setTimeout(res,350))]);
      r = triageData;
    } catch {
      r = {category:'General Issue',urgency:'Medium',urgency_score:2,anger_detected:false,route_to:'Unassigned',auto_reply:'Triage service could not be reached.',auto_resolvable:false,_isRealAI:false};
    }
    setIncomingQueue(prev=>prev.filter(q=>q.id!==ticket.id));
    if (r.auto_resolvable) setAutoCount(p=>{const n=p+1;localStorage.setItem('triage_auto',n);return n;});
    if (r.anger_detected)  setAngerCount(p=>{const n=p+1;localStorage.setItem('triage_anger',n);return n;});
    setResultTicket(ticket); setResult(r); setThinking(false); setProcessing(false);
  }

  function removeFromQueue(backendId) {
    setIncomingQueue(prev=>prev.filter(q=>q.id!==('#'+backendId)));
    if (previewId===('#'+backendId)) setPreviewId(null);
  }

  async function handleResolve(backendId) {
    const t = tickets.find(t=>String(t._backend_id)===String(backendId));
    if (!t) return;
    await resolveTicket(t);
    removeFromQueue(backendId);
    setResult(r=>({...r}));
  }

  async function handleEscalate(backendId) {
    const t = tickets.find(t=>String(t._backend_id)===String(backendId));
    if (!t) return;
    await escalateTicket(t);
    removeFromQueue(backendId);
    setResult(r=>({...r}));
  }

  const matchedTicket = resultTicket?._backend_id ? tickets.find(t=>String(t._backend_id)===String(resultTicket._backend_id)) : null;
  const alreadyResolved  = matchedTicket?.status==='resolved';
  const alreadyEscalated = matchedTicket?._escalated===true;

  return (
    <div className="page active">
      <div className="stats-row">
        <div className="stat"><div className="stat-label">Incoming Queue</div><div className="stat-val">{sorted.length}</div><div className="stat-sub warn">waiting to process</div></div>
        <div className="stat"><div className="stat-label">Auto-processed</div><div className="stat-val">{autoCount}</div><div className="stat-sub up">by AI today</div></div>
        <div className="stat"><div className="stat-label">Anger Detected</div><div className="stat-val">{angerCount}</div><div className="stat-sub down">needs priority</div></div>
        <div className="stat"><div className="stat-label">Avg AI Speed</div><div className="stat-val">2.4<span style={{fontSize:14,color:'var(--text3)'}}>s</span></div><div className="stat-sub up">per ticket</div></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:16}}>
        <div style={{minWidth:0}}>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'16px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div className="card-title" style={{margin:0}}>Incoming Complaints — Auto Queue</div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:11,color:'var(--text3)'}}>{sorted.length} waiting</span>
                <div style={{width:8,height:8,borderRadius:'50%',background:'var(--green)',boxShadow:'0 0 6px var(--green)',animation:'pulse 2s infinite'}}></div>
              </div>
            </div>
            <div style={{maxHeight:360,overflowY:'auto'}}>
              {sorted.length===0?(
                <div style={{textAlign:'center',padding:32,color:'var(--text3)',fontSize:13}}>✓ All complaints processed</div>
              ):sorted.map((item,idx)=>(
                <div key={item.id} className={`queue-item${(idx===0||item.id===previewId)?' next':''}`} style={{cursor:'pointer'}} onClick={()=>preview(item)}>
                  <div className="qi-dot" style={{background:idx===0?'var(--green)':'var(--text3)'}}></div>
                  <div className="qi-body">
                    <div className="qi-user">{item.user} <span style={{fontSize:11,color:'var(--text3)',fontWeight:400,marginLeft:6}}>{item.time}</span></div>
                    <div className="qi-msg">{item.msg}</div>
                    <div className="qi-id">{item.id}</div>
                  </div>
                  {idx===0&&<span className="next-badge">NEXT</span>}
                </div>
              ))}
            </div>
            <div style={{padding:'14px 18px',borderTop:'1px solid var(--border)',background:'var(--bg3)'}}>
              <button className="ai-btn" onClick={processNext} disabled={processing||sorted.length===0}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5.5"/><path d="M5 7l1.5 1.5L9 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {processing?'Processing...':sorted.length===0?'All Processed':'Process Next with AI'}
              </button>
              {thinking&&(
                <div className="thinking" style={{marginTop:10,marginBottom:0}}>
                  <div className="dots"><span></span><span></span><span></span></div>
                  <span className="think-txt">AI is analyzing incoming complaint...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div className="card">
            <div className="card-title">Latest AI Analysis</div>
            {!result?(
              <div style={{textAlign:'center',padding:24,color:'var(--text3)',fontSize:13}}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" style={{display:'block',margin:'0 auto 10px',opacity:.3}}>
                  <circle cx="16" cy="16" r="13"/><path d="M16 10v6l4 4"/>
                </svg>
                Waiting for next complaint to process...
              </div>
            ):(
              <div style={{animation:'fadeUp .3s ease'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{resultTicket?.user}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:10,color:'var(--text3)',fontFamily:'monospace'}}>{resultTicket?.id}</span>
                    <span style={{fontSize:10,padding:'2px 7px',background:result._isRealAI?'var(--gdim)':'var(--rdim)',color:result._isRealAI?'var(--green)':'var(--red)',border:`1px solid ${result._isRealAI?'var(--gborder)':'rgba(240,82,82,.25)'}`,borderRadius:10}}>
                      {result._isRealAI?'Real AI':'Unavailable'}
                    </span>
                  </div>
                </div>
                <div style={{fontSize:12,color:'var(--text2)',lineHeight:1.55,background:'var(--bg3)',padding:'10px 12px',borderRadius:8,marginBottom:12}}>{resultTicket?.msg}</div>
                {result.anger_detected&&<div style={{background:'var(--rdim)',border:'1px solid rgba(240,82,82,.25)',borderRadius:8,padding:'9px 12px',fontSize:12,color:'var(--red)',marginBottom:12}}>⚠️ Anger detected — priority handling required</div>}
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                  <span className={`tag ${tagMap[result.category]||'tag-confusion'}`}>{result.category}</span>
                  <span className={`urgency-badge ${urgMap[result.urgency]||'ub-low'}`}>{result.urgency}</span>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:'var(--text3)',marginBottom:5,display:'flex',justifyContent:'space-between'}}><span>Urgency</span><span>{result.urgency_score}/3</span></div>
                  <div className="track"><div className="track-fill" style={{width:widthMap[result.urgency_score],background:colorMap[result.urgency_score]}}></div></div>
                </div>
                <div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>Routed to</div>
                <div style={{fontSize:13,fontWeight:500,color:'var(--green)',marginBottom:12}}>→ {result.route_to}</div>
                <div style={{fontSize:11,color:'var(--green)',textTransform:'uppercase',letterSpacing:'.06em',fontWeight:600,marginBottom:5}}>Auto-reply sent to user</div>
                <div style={{background:'var(--bg3)',borderLeft:'3px solid var(--green)',borderRadius:'0 8px 8px 0',padding:'10px 12px',fontSize:12,color:'var(--text2)',lineHeight:1.6,marginBottom:14}}>{result.auto_reply}</div>
                {matchedTicket&&(
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>handleResolve(resultTicket._backend_id)} disabled={alreadyResolved}
                      style={{flex:1,padding:'9px 0',borderRadius:8,border:'1px solid var(--gborder)',background:alreadyResolved?'var(--bg3)':'var(--gdim)',color:'var(--green)',fontSize:12,fontWeight:500,cursor:alreadyResolved?'default':'pointer',opacity:alreadyResolved?.5:1}}>
                      {alreadyResolved?'✓ Resolved':'Resolve'}
                    </button>
                    <button onClick={()=>handleEscalate(resultTicket._backend_id)} disabled={alreadyResolved||alreadyEscalated}
                      style={{flex:1,padding:'9px 0',borderRadius:8,border:'1px solid rgba(240,82,82,.25)',background:(alreadyResolved||alreadyEscalated)?'var(--bg3)':'var(--rdim)',color:'var(--red)',fontSize:12,fontWeight:500,cursor:(alreadyResolved||alreadyEscalated)?'default':'pointer',opacity:(alreadyResolved||alreadyEscalated)?.5:1}}>
                      {alreadyEscalated?'✓ Escalated':'Escalate'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}