import { useState } from 'react';
import { loginUser } from '../utils/auth.js';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username || !password) { setError('Please enter both username and password.'); return; }
    setLoading(true); setError('');
    try {
      await loginUser(username, password);
      onLogin();
    } catch {
      setError('Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,padding:'40px 36px',width:'100%',maxWidth:400}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:28}}>
          <div style={{width:32,height:32,background:'var(--green)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
              <polyline points="1,9 4,9 5.5,4 8,14 10,7 12,11 13.5,9 17,9" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{fontSize:18,fontWeight:600,color:'var(--text)'}}>
            Bustler <span style={{color:'var(--green)'}}>Pulse</span>
          </div>
        </div>

        <h2 style={{fontSize:20,fontWeight:600,color:'var(--text)',marginBottom:6}}>Ops Team Login</h2>
        <p style={{color:'var(--text2)',fontSize:13,marginBottom:28}}>Sign in to access the operations dashboard</p>

        {error && (
          <div style={{background:'var(--rdim)',border:'1px solid rgba(240,82,82,.3)',color:'var(--red)',borderRadius:8,padding:'10px 14px',fontSize:13,marginBottom:16}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:6}}>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username"
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontFamily:'inherit',fontSize:14,marginBottom:16,outline:'none',boxSizing:'border-box'}}/>
          <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:6}}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
            style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px',color:'var(--text)',fontFamily:'inherit',fontSize:14,marginBottom:16,outline:'none',boxSizing:'border-box'}}/>
          <button type="submit" disabled={loading}
            style={{width:'100%',background:'var(--green)',color:'#0e0f11',border:'none',borderRadius:8,padding:11,fontSize:14,fontWeight:600,fontFamily:'inherit',cursor:loading?'not-allowed':'pointer',opacity:loading?0.6:1}}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{marginTop:20,textAlign:'center',fontSize:12,color:'var(--text3)'}}>
          Bustler Pulse · Internal Ops Tool
        </div>
      </div>
    </div>
  );
}