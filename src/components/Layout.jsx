import { useState, useEffect } from 'react';
import { getUser } from '../utils/auth.js';

export default function Layout({ children, page, setPage, theme, setTheme, ticketStore, onLogout }) {
  const [clock, setClock] = useState('');
  const username = getUser();
  const initials = username.split(/[\s_]+/).filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'OA';

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const { tickets, incomingQueue, connected, ticketCount } = ticketStore;
  const nbOpen     = tickets.filter(t => t.status === 'open' || t.status === 'progress').length;
  const nbUrgent   = tickets.filter(t => t.urgency_score === 3 && t.status !== 'resolved').length;
  const nbDispute  = tickets.filter(t => t.category === 'Dispute' && t.status !== 'resolved').length;
  const nbResolved = tickets.filter(t => t.status === 'resolved').length;
  const nbTriage   = incomingQueue.length;

  const PAGE_TITLES = { dashboard:'Dashboard', tickets:'All Tickets', triage:'AI Triage', agents:'Agent Profiles', feedback:'User Feedback' };
  const PAGE_SUBS   = { tickets:'Manage and resolve incoming user tickets', triage:'Complaints arrive automatically — AI classifies and routes them', agents:'Live performance profiles — updates every time a ticket is resolved', feedback:'Ratings submitted by users after resolution' };
  const subtitle = page === 'dashboard' ? `Welcome back, ${username} — here's today's overview` : (PAGE_SUBS[page] || '');

  const NavItem = ({ id, icon, label, badge, badgeColor }) => (
    <button className={`nav-item${page === id ? ' active' : ''}`} onClick={() => setPage(id)}>
      {icon}{label}
      {badge > 0 && <span className={`nav-badge${badgeColor ? ' ' + badgeColor : ''}`}>{badge}</span>}
    </button>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="logo-row">
            <div className="logo-icon">
              <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
                <polyline points="1,9 4,9 5.5,4 8,14 10,7 12,11 13.5,9 17,9" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="logo-title">Bustler Pulse</div>
              <div className="logo-sub">Ops Layer · Pillar 2</div>
            </div>
          </div>
        </div>

        <button onClick={onLogout} style={{margin:'10px 12px',width:'calc(100% - 24px)',background:'transparent',border:'1px solid rgba(255,255,255,0.15)',color:'#9a9da6',padding:'7px 14px',borderRadius:6,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
          🔓 Logout
        </button>

        <nav className="nav">
          <div className="nav-label">Main</div>
          <NavItem id="dashboard" label="Dashboard" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>} />
          <NavItem id="tickets"   label="All Tickets"    badge={nbOpen}   icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="2" width="14" height="12" rx="2"/><path d="M4 6h8M4 9h5"/></svg>} />
          <NavItem id="triage"    label="AI Triage"      badge={nbTriage} badgeColor="purple" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2" strokeLinecap="round"/></svg>} />
          <NavItem id="agents"    label="Agent Profiles" icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="3"/><path d="M1 13c0-3 2-5 5-5s5 2 5 5"/><circle cx="12" cy="5" r="2"/><path d="M12 9c2 0 3 1.5 3 3.5"/></svg>} />
          <NavItem id="feedback"  label="Feedback"       icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l1.9 3.8 4.1.6-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.1-.6z"/></svg>} />

          <div className="nav-label" style={{marginTop:10}}>Queues</div>
          <button className="nav-item" onClick={() => setPage('tickets')}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1L10 6H15L11 9.5L12.5 14.5L8 11.5L3.5 14.5L5 9.5L1 6H6L8 1Z"/></svg>
            Urgent Queue {nbUrgent > 0 && <span className="nav-badge">{nbUrgent}</span>}
          </button>
          <button className="nav-item" onClick={() => setPage('tickets')}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10C2 7 4 5 8 5s6 2 6 5"/><path d="M5 5C5 3 6.5 2 8 2s3 1 3 3"/><path d="M4 13l1-3M12 13l-1-3"/></svg>
            Disputes {nbDispute > 0 && <span className="nav-badge amber">{nbDispute}</span>}
          </button>
          <button className="nav-item" onClick={() => setPage('tickets')}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Resolved Today {nbResolved > 0 && <span className="nav-badge green">{nbResolved}</span>}
          </button>
        </nav>

        <div className="sb-footer">
          <div className="agent-row">
            <div className="agent-av">{initials}</div>
            <div>
              <div className="agent-name">{username}</div>
              <div className="agent-role">Ops Intern · Pillar 2</div>
            </div>
            <div className="online"></div>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div className="tb-left">
            <div className="page-title">{PAGE_TITLES[page] || page}</div>
            <div className="page-sub">{subtitle}</div>
          </div>
          <div className="tb-right">
            <div className="time-chip">{clock}</div>
            <div className="theme-toggle">
              <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
                <svg viewBox="0 0 13 13" fill="currentColor"><path d="M11 7.5A5 5 0 016 2a5 5 0 100 10 5 5 0 005-4.5z"/></svg>
                Dark
              </button>
              <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
                <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="6.5" cy="6.5" r="2.5"/><path d="M6.5 1v1.2M6.5 10.8V12M1 6.5h1.2M10.8 6.5H12" strokeLinecap="round"/></svg>
                Light
              </button>
            </div>
            <div className="status-pill" style={connected ? {background:'var(--gdim)',color:'var(--green)',borderColor:'var(--gborder)'} : {background:'var(--adim)',color:'var(--amber)'}}>
              <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
              {connected ? `Live — ${ticketCount} real tickets loaded` : 'Demo Mode — backend offline'}
            </div>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}