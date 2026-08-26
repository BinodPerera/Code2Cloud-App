import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Key, Copy, Check, ShieldCheck, Github, Info, Cpu, Trash2, Plus, Database, AlertTriangle } from 'lucide-react';
import { apiClient } from '../utils/api';

function SettingsPage() {
  const { user, token } = useAuth();
  const [copied, setCopied] = useState(false);

  // Credentials State
  const [credentials, setCredentials] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [credName, setCredName] = useState('');
  const [credProvider, setCredProvider] = useState('aws');
  const [awsKeyId, setAwsKeyId] = useState('');
  const [awsSecretKey, setAwsSecretKey] = useState('');
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [gcpKey, setGcpKey] = useState('');
  const [gcpProjectId, setGcpProjectId] = useState('');
  const [dockerUser, setDockerUser] = useState('');
  const [dockerPass, setDockerPass] = useState('');
  const [submittingCred, setSubmittingCred] = useState(false);
  const [credError, setCredError] = useState('');

  const fetchCredentials = async () => {
    if (!token) return;
    try {
      setLoadingCreds(true);
      const res = await apiClient.get('/credentials/');
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } catch (err) {
      console.error("Failed to fetch credentials", err);
    } finally {
      setLoadingCreds(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [token]);

  const handleCreateCredential = async (e) => {
    e.preventDefault();
    if (!credName.trim()) return;
    if (!token) return;

    setSubmittingCred(true);
    setCredError('');

    let data = {};
    if (credProvider === 'aws') {
      data = {
        aws_access_key_id: awsKeyId,
        aws_secret_access_key: awsSecretKey,
        aws_region: awsRegion
      };
    } else if (credProvider === 'gcp') {
      data = {
        gcp_sa_key: gcpKey,
        gcp_project_id: gcpProjectId
      };
    } else if (credProvider === 'dockerhub') {
      data = {
        docker_username: dockerUser,
        docker_password: dockerPass
      };
    }

    try {
      const res = await apiClient.post('/credentials/', {
        name: credName,
        provider: credProvider,
        data: data
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to save credential');
      }

      // Reset Form
      setCredName('');
      setAwsKeyId('');
      setAwsSecretKey('');
      setAwsRegion('us-east-1');
      setGcpKey('');
      setGcpProjectId('');
      setDockerUser('');
      setDockerPass('');
      
      // Refresh list
      await fetchCredentials();
    } catch (err) {
      setCredError(err.message || 'An error occurred while saving credential.');
    } finally {
      setSubmittingCred(false);
    }
  };

  const handleDeleteCredential = async (id) => {
    if (!window.confirm("Are you sure you want to delete this credential?")) return;
    try {
      const res = await apiClient.delete(`/credentials/${id}`);
      if (res.ok) {
        await fetchCredentials();
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to delete credential");
      }
    } catch (err) {
      alert("Error deleting credential: " + err.message);
    }
  };

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
          <Settings size={32} style={{ color: 'var(--c2c-green)' }} />
          Account Settings
        </h2>
        <p style={{ color: '#a2a2b5', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
          Manage your developer profiles, secure OAuth sessions, and API access tokens.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
        
        {/* 1. SCM Integration Profile Card */}
        <div style={{
          background: 'var(--c2c-surface)',
          border: '2px solid var(--c2c-border)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Github size={20} style={{ color: 'var(--c2c-green)' }} />
              SCM Integration
            </h3>
            <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Your active version control session details authenticated via GitHub OAuth.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem', background: 'var(--c2c-nav-bg)', borderRadius: '16px', border: '2px solid var(--c2c-border)' }}>
            <img
              src={user?.avatar_url}
              alt={user?.login}
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--c2c-green)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '600', color: '#fff' }}>{user?.name || user?.login}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.2rem 0.5rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', border: '2px solid rgba(16, 185, 129, 0.3)' }}>
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
          border: '2px solid var(--c2c-border)',
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

          <div style={{ background: 'rgba(0,0,0,0.15)', border: '2px solid var(--c2c-border)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, color: '#e2e2e9', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Because Code2Cloud uses a **GitHub App integration** (`code2cloud-dev`), repositories belonging to organizations or other users are only visible if the **GitHub App is explicitly installed** on that namespace or repository.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#a2a2b5' }}>
              <span style={{ color: '#fff', fontWeight: '600' }}>💡 Missing repositories? Follow these steps:</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--c2c-green)' }}>1.</span>
                <span>Click the button below to visit the official GitHub App installation page.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--c2c-green)' }}>2.</span>
                <span>Select the specific organization or user namespace that owns the collaborated repositories.</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--c2c-green)' }}>3.</span>
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
                background: 'linear-gradient(135deg, var(--c2c-green), var(--c2c-green-hover))',
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
          background: 'var(--c2c-surface)',
          border: '2px solid var(--c2c-border)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={20} style={{ color: 'var(--c2c-green)' }} />
              Developer API Access Token
            </h3>
            <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Your secure JSON Web Token (JWT) used to authenticate manual requests and scripts.
            </p>
          </div>

          {/* Masked Token Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: 'var(--c2c-nav-bg)',
              border: '2px solid var(--c2c-border)',
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
                  background: copied ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, var(--c2c-green), var(--c2c-green-hover))',
                  border: copied ? '2px solid #10B981' : '2px solid transparent',
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

        </div>

        {/* 3. Cloud & Container Registry Credentials Manager Card */}
        <div style={{
          background: 'var(--c2c-surface)',
          border: '2px solid var(--c2c-border)',
          borderRadius: '24px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={20} style={{ color: 'var(--c2c-green)' }} />
              Cloud & Container Registry Credentials
            </h3>
            <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Securely store credentials to automatically link and configure GitHub Action secrets during pipeline setup.
            </p>
          </div>

          {/* Existing Credentials List */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#a2a2b5', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saved Profiles</h4>
            {loadingCreds ? (
              <div style={{ color: '#6e7191', fontSize: '0.9rem', padding: '0.5rem 0' }}>Loading saved credentials...</div>
            ) : credentials.length === 0 ? (
              <div style={{ color: '#6e7191', fontSize: '0.9rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '2px dashed var(--c2c-border)', textAlign: 'center' }}>
                No saved credentials. Add one using the form below.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {credentials.map((cred) => {
                  let providerColor = '#10B981'; // AWS green
                  if (cred.provider === 'gcp') providerColor = '#4285F4'; // GCP blue
                  if (cred.provider === 'dockerhub') providerColor = '#2496ED'; // DockerHub blue

                  return (
                    <div 
                      key={cred.credential_id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '1rem 1.25rem', 
                        background: 'var(--c2c-nav-bg)', 
                        borderRadius: '16px', 
                        border: '2px solid var(--c2c-border)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '700', 
                          color: providerColor, 
                          background: `rgba(${cred.provider === 'aws' ? '16,185,129' : cred.provider === 'gcp' ? '66,133,244' : '36,150,237'}, 0.1)`, 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '8px',
                          textTransform: 'uppercase'
                        }}>
                          {cred.provider === 'dockerhub' ? 'Docker Hub' : cred.provider}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>{cred.name}</span>
                          <span style={{ color: '#6e7191', fontSize: '0.75rem' }}>
                            {cred.provider === 'aws' && `Key ID: ${cred.data.aws_access_key_id}`}
                            {cred.provider === 'gcp' && `Project ID: ${cred.data.gcp_project_id}`}
                            {cred.provider === 'dockerhub' && `User: ${cred.data.docker_username}`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCredential(cred.credential_id)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: '#ff6b6b', 
                          cursor: 'pointer', 
                          padding: '0.5rem', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        title="Delete Profile"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '2px solid var(--c2c-border)', margin: '0.5rem 0' }} />

          {/* Add New Credential Form */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#a2a2b5', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Add Credential Profile
            </h4>
            
            <form onSubmit={handleCreateCredential} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {credError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 107, 107, 0.1)', border: '2px solid rgba(255, 107, 107, 0.3)', color: '#ff6b6b', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                  <AlertTriangle size={16} />
                  <span>{credError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>PROFILE NAME</label>
                  <input
                    type="text"
                    required
                    value={credName}
                    onChange={(e) => setCredName(e.target.value)}
                    placeholder="e.g. Personal AWS Account"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.8rem 1rem', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>PROVIDER</label>
                  <select
                    value={credProvider}
                    onChange={(e) => setCredProvider(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.8rem 1rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="aws" style={{ background: '#0f0f15', color: '#fff' }}>Amazon Web Services (AWS)</option>
                    <option value="gcp" style={{ background: '#0f0f15', color: '#fff' }}>Google Cloud Platform (GCP)</option>
                    <option value="dockerhub" style={{ background: '#0f0f15', color: '#fff' }}>Docker Hub</option>
                  </select>
                </div>
              </div>

              {/* Conditional Provider inputs */}
              {credProvider === 'aws' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>AWS ACCESS KEY ID</label>
                      <input
                        type="text"
                        required
                        value={awsKeyId}
                        onChange={(e) => setAwsKeyId(e.target.value)}
                        placeholder="AKIA..."
                        style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.8rem 1rem', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>AWS REGION (DEFAULT)</label>
                      <input
                        type="text"
                        required
                        value={awsRegion}
                        onChange={(e) => setAwsRegion(e.target.value)}
                        placeholder="us-east-1"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.8rem 1rem', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>AWS SECRET ACCESS KEY</label>
                    <input
                      type="password"
                      required
                      value={awsSecretKey}
                      onChange={(e) => setAwsSecretKey(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.8rem 1rem', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              {credProvider === 'gcp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>GCP PROJECT ID (OPTIONAL)</label>
                    <input
                      type="text"
                      value={gcpProjectId}
                      onChange={(e) => setGcpProjectId(e.target.value)}
                      placeholder="Will auto-extract from JSON Key if left blank"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.8rem 1rem', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>GCP SERVICE ACCOUNT KEY (JSON)</label>
                    <textarea
                      required
                      rows={5}
                      value={gcpKey}
                      onChange={(e) => setGcpKey(e.target.value)}
                      placeholder='{ "type": "service_account", "project_id": "...", ... }'
                      style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.8rem 1rem', outline: 'none', fontFamily: 'monospace', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {credProvider === 'dockerhub' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>DOCKER HUB USERNAME</label>
                    <input
                      type="text"
                      required
                      value={dockerUser}
                      onChange={(e) => setDockerUser(e.target.value)}
                      placeholder="docker_username"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.8rem 1rem', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>DOCKER HUB ACCESS TOKEN / PASSWORD</label>
                    <input
                      type="password"
                      required
                      value={dockerPass}
                      onChange={(e) => setDockerPass(e.target.value)}
                      placeholder="dckr_pat_..."
                      style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.8rem 1rem', outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingCred}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: submittingCred ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--c2c-green), var(--c2c-green-hover))',
                  border: 'none',
                  color: submittingCred ? '#a2a2b5' : '#05050a',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: submittingCred ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '0.5rem'
                }}
              >
                <Plus size={16} />
                {submittingCred ? 'Saving...' : 'Save Credential'}
              </button>

            </form>
          </div>

        </div>

      </div>

    </div>
  );
}

export default SettingsPage;
