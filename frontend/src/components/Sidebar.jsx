import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, MessageSquare, LayoutDashboard, History, Settings } from 'lucide-react';

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
      background: 'var(--c2c-nav-bg)',
      borderRight: '2px solid var(--c2c-border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      padding: '2rem 1.5rem',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', padding: '0 0.5rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--c2c-border)' }}>
          <span style={{ fontSize: '1.5rem' }}>☁️</span>
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, background: 'linear-gradient(135deg, #fff, var(--c2c-text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Code2Cloud</h1>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
        <button
          onClick={() => handleNavClick('/services')}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
            borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: location.pathname === '/services' || location.pathname === '/' ? 'var(--c2c-selected-bg)' : 'transparent',
            color: location.pathname === '/services' || location.pathname === '/' ? '#fff' : 'var(--c2c-text-secondary)',
            fontWeight: location.pathname === '/services' || location.pathname === '/' ? '600' : '500'
          }}
          onMouseOver={(e) => {
            if (location.pathname !== '/services' && location.pathname !== '/') {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseOut={(e) => {
            if (location.pathname !== '/services' && location.pathname !== '/') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--c2c-text-secondary)';
            }
          }}
        >
          <LayoutDashboard size={20} style={{ color: location.pathname === '/services' || location.pathname === '/' ? 'var(--c2c-green)' : 'inherit' }} />
          Our Services
        </button>

        <button
          onClick={() => handleNavClick('/chat')}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
            borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: location.pathname === '/chat' ? 'var(--c2c-selected-bg)' : 'transparent',
            color: location.pathname === '/chat' ? '#fff' : 'var(--c2c-text-secondary)',
            fontWeight: location.pathname === '/chat' ? '600' : '500'
          }}
          onMouseOver={(e) => {
            if (location.pathname !== '/chat') {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseOut={(e) => {
            if (location.pathname !== '/chat') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--c2c-text-secondary)';
            }
          }}
        >
          <MessageSquare size={20} style={{ color: location.pathname === '/chat' ? 'var(--c2c-green)' : 'inherit' }} />
          Chat
        </button>

        <button
          onClick={() => handleNavClick('/history')}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
            borderRadius: '16px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: location.pathname === '/history' ? 'var(--c2c-selected-bg)' : 'transparent',
            color: location.pathname === '/history' ? '#fff' : 'var(--c2c-text-secondary)',
            fontWeight: location.pathname === '/history' ? '600' : '500'
          }}
          onMouseOver={(e) => {
            if (location.pathname !== '/history') {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseOut={(e) => {
            if (location.pathname !== '/history') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--c2c-text-secondary)';
            }
          }}
        >
          <History size={20} style={{ color: location.pathname === '/history' ? 'var(--c2c-green)' : 'inherit' }} />
          Generation History
        </button>
      </nav>

      {/* User Profile Section at Bottom */}
      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '2px solid var(--c2c-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
          <img
            src={user?.avatar_url}
            alt={user?.login}
            style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--c2c-border)' }}
          />
          <div style={{ overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || user?.login}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--c2c-text-secondary)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>@{user?.login}</p>
          </div>
        </div>

        {/* Actions Row (Settings & Logout side-by-side) */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            onClick={() => handleNavClick('/settings')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: location.pathname === '/settings' ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
              border: location.pathname === '/settings' ? '2px solid var(--c2c-green)' : '2px solid var(--c2c-border)',
              color: location.pathname === '/settings' ? '#fff' : 'var(--c2c-text-secondary)',
              padding: '0.75rem 0.5rem',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.85rem',
              fontWeight: location.pathname === '/settings' ? '600' : '500'
            }}
            onMouseOver={(e) => {
              if (location.pathname !== '/settings') {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)';
                e.currentTarget.style.borderColor = 'var(--c2c-green)';
              }
            }}
            onMouseOut={(e) => {
              if (location.pathname !== '/settings') {
                e.currentTarget.style.color = 'var(--c2c-text-secondary)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'var(--c2c-border)';
              }
            }}
          >
            <Settings size={14} />
            Settings
          </button>

          <button
            onClick={logout}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '2px solid var(--c2c-border)',
              color: 'var(--c2c-text-secondary)',
              padding: '0.75rem 0.5rem',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#ff6b6b';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--c2c-text-secondary)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.borderColor = 'var(--c2c-border)';
            }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
