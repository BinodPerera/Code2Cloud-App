import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Key, Copy, Check, ShieldCheck, Github, Info, Cpu } from 'lucide-react';

function SettingsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    const token = localStorage.getItem('code2cloud_token');
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMaskedToken = () => {
    const token = localStorage.getItem('code2cloud_token');
    if (!token) return 'No active session token';
    return `${token.substring(0, 24)}••••••••••••••••••••••••••••••••${token.substring(token.length - 12)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings size={32} style={{ color: '#00E5FF' }} />
          Account Settings
        </h2>
        <p style={{ color: '#a2a2b5', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
          Manage your developer profiles, secure OAuth sessions, and API access tokens.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
        
        {/* 1. SCM Integration Profile Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Github size={20} style={{ color: '#00E5FF' }} />
              SCM Integration
            </h3>
            <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Your active version control session details authenticated via GitHub OAuth.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem', background: 'rgba(0,0,0,0.15)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <img
              src={user?.avatar_url}
              alt={user?.login}
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid rgba(0, 229, 255, 0.3)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '600', color: '#fff' }}>{user?.name || user?.login}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <ShieldCheck size={12} fill="currentColor" style={{ color: '#040407' }} />
                  Connected
                </span>
              </div>
              <span style={{ color: '#a2a2b5', fontSize: '0.9rem' }}>@{user?.login}</span>
              {user?.email && <span style={{ color: '#6e7191', fontSize: '0.8rem' }}>{user.email}</span>}
            </div>
          </div>
        </div>

        {/* 1.5 SCM Organization & Collaboration Access Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Github size={20} style={{ color: '#00E5FF' }} />
              Organization & Collaboration Repositories
            </h3>
            <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Enable access and visibility for organization-owned and collaborated repositories.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, color: '#e2e2e9', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Because Code2Cloud uses a **GitHub App integration** (`code2cloud-dev`), repositories belonging to organizations or other users are only visible if the **GitHub App is explicitly installed** on that namespace or repository.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#a2a2b5' }}>
              <span style={{ color: '#fff', fontWeight: '600' }}>💡 Missing repositories? Follow these steps:</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: '#00E5FF' }}>1.</span>
                <span>Click the button below to visit the official GitHub App installation page.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: '#00E5FF' }}>2.</span>
                <span>Select the specific organization or user namespace that owns the collaborated repositories.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: '#00E5FF' }}>3.</span>
                <span>Choose <strong>"All repositories"</strong> or explicitly add the collaborated repositories, and click **Install / Authorize**.</span>
              </div>
            </div>
            <a
              href="https://github.com/apps/code2cloud-dev/installations/new"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #00E5FF, #5865F2)',
                border: 'none',
                color: '#05050a',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: '700',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: 'fit-content',
                marginTop: '0.5rem'
              }}
            >
              Configure / Install GitHub App
            </a>
          </div>
        </div>

        {/* 2. Developer API Token Settings Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={20} style={{ color: '#00E5FF' }} />
              Developer API Access Token
            </h3>
            <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Your secure JSON Web Token (JWT) used to authenticate manual requests and scripts.
            </p>
          </div>

          {/* Masked Token Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#e2e2e9',
              wordBreak: 'break-all',
              lineHeight: '1.4',
              userSelect: 'all',
              position: 'relative'
            }}>
              {getMaskedToken()}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={copyToken}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: copied ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, #00E5FF, #5865F2)',
                  border: copied ? '1px solid #10B981' : 'none',
                  color: copied ? '#10B981' : '#05050a',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: copied ? 'none' : '0 4px 15px rgba(88, 101, 242, 0.2)'
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied to Clipboard!' : 'Copy JWT Token'}
              </button>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6e7191', fontSize: '0.8rem' }}>
                <Info size={14} />
                Keep this token private. It grants administrative API permissions.
              </span>
            </div>
          </div>

          {/* Integration Advise Card */}
          <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'rgba(0, 229, 255, 0.03)', border: '1px solid rgba(0, 229, 255, 0.1)', borderRadius: '12px' }}>
            <Cpu size={18} style={{ color: '#00E5FF', flexShrink: 0, marginTop: '0.1rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>Swagger / OpenAPI Manual Testing</span>
              <p style={{ margin: 0, color: '#a2a2b5', fontSize: '0.8rem', lineHeight: '1.4' }}>
                Open the interactive Swagger UI boundary at <code style={{ color: '#00E5FF' }}>http://localhost:8000/docs</code>, click **Authorize** in the top right, and paste this JWT token directly inside the input box to manually trigger deployment generations or tech stack queries!
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default SettingsPage;
