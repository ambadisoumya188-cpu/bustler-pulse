import { useState, useEffect } from 'react';
import { isLoggedIn } from './utils/auth.js';
import { useTickets } from './hooks/useTickets.js';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AllTickets from './pages/AllTickets.jsx';
import AITriage from './pages/AITriage.jsx';
import AgentProfiles from './pages/AgentProfiles.jsx';
import Feedback from './pages/Feedback.jsx';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [page, setPage] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('bustler-theme') || 'dark');
  const ticketStore = useTickets();

  useEffect(() => {
    if (theme === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
    localStorage.setItem('bustler-theme', theme);
  }, [theme]);

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard ticketStore={ticketStore} setPage={setPage} />;
      case 'tickets':   return <AllTickets ticketStore={ticketStore} />;
      case 'triage':    return <AITriage ticketStore={ticketStore} />;
      case 'agents':    return <AgentProfiles ticketStore={ticketStore} />;
      case 'feedback':  return <Feedback />;
      default:          return <Dashboard ticketStore={ticketStore} setPage={setPage} />;
    }
  };

  return (
    <Layout page={page} setPage={setPage} theme={theme} setTheme={setTheme}
      ticketStore={ticketStore} onLogout={() => { sessionStorage.clear(); setLoggedIn(false); }}>
      {renderPage()}
    </Layout>
  );
}