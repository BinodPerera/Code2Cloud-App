import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, MessageSquare, LayoutDashboard } from 'lucide-react';

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <aside style={{
      width: '280px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      padding: '2rem 1.5rem',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', padding: '0 0.5rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '1.5rem' }}>☁️</span>
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, background: 'linear-gradient(135deg, #fff, #a2a2b5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Code2Cloud</h1>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
        <button
          onClick={() => handleNavClick('/services')}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
            borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: location.pathname === '/services' || location.pathname === '/' ? 'rgba(88, 101, 242, 0.15)' : 'transparent',
            color: location.pathname === '/services' || location.pathname === '/' ? '#fff' : '#a2a2b5',
            fontWeight: location.pathname === '/services' || location.pathname === '/' ? '600' : '500'
          }}
          onMouseOver={(e) => {
            if (location.pathname !== '/services' && location.pathname !== '/') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseOut={(e) => {
            if (location.pathname !== '/services' && location.pathname !== '/') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#a2a2b5';
            }
          }}
        >
          <LayoutDashboard size={20} style={{ color: location.pathname === '/services' || location.pathname === '/' ? '#5865F2' : 'inherit' }} />
          Our Services
        </button>

        <button
          onClick={() => handleNavClick('/chat')}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
            borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: location.pathname === '/chat' ? 'rgba(88, 101, 242, 0.15)' : 'transparent',
            color: location.pathname === '/chat' ? '#fff' : '#a2a2b5',
            fontWeight: location.pathname === '/chat' ? '600' : '500'
          }}
          onMouseOver={(e) => {
            if (location.pathname !== '/chat') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseOut={(e) => {
            if (location.pathname !== '/chat') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#a2a2b5';
            }
          }}
        >
          <MessageSquare size={20} style={{ color: location.pathname === '/chat' ? '#5865F2' : 'inherit' }} />
          Chat
        </button>
      </nav>

      {/* User Profile Section at Bottom */}
      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
          <img
            src={user?.avatar_url}
            alt={user?.login}
            style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || user?.login}</h3>
            <p style={{ fontSize: '0.85rem', color: '#a2a2b5', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>@{user?.login}</p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#a2a2b5', padding: '0.85rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
            fontSize: '0.95rem'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,107,107,0.3)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#a2a2b5'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
