import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookMarked, Star, GitFork, ExternalLink, ArrowLeft } from 'lucide-react';
import { apiClient } from '../utils/api';

function Repos() {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch repositories from the user auth context when it exists
  useEffect(() => {
    const fetchRepos = async () => {
      if (!token) return;

      try {
        setLoading(true);
        // Using centralized apiClient which handles auth headers and 401s
        const response = await apiClient.get('/repos/');
        const data = await response.json();
        
        // Sort by updated at, most recent first
        const sortedData = data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setRepos(sortedData);
      } catch (err) {
        if (err.message !== 'Unauthorized') {
          setError('Error loading repositories. Please try again later.');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [user, token]);

  const serviceId = location.state?.service;

  const getServiceTitle = () => {
    switch (serviceId) {
      case 'finops': return 'Cost Analysis';
      case 'docker': return 'Docker Generation';
      case 'terraform': return 'Terraform Generation';
      default: return '';
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/services')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '2px solid var(--c2c-border)', color: '#a2a2b5', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#a2a2b5'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          <ArrowLeft size={16} />
          Back to Services
        </button>
      </div>

      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '600', letterSpacing: '-0.5px' }}>
        Your Repositories <span style={{ color: '#a2a2b5', fontSize: '1rem', fontWeight: '400', marginLeft: '0.5rem' }}>({repos.length})</span>
      </h2>
      {serviceId && (
        <p style={{ color: '#a2a2b5', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          Select a repository for <strong style={{ color: '#fff', fontWeight: '600' }}>{getServiceTitle()}</strong>
        </p>
      )}

      {/* GitHub App Installation / Visibility Info Card */}
      {!loading && !error && (
        <div style={{
          background: 'var(--c2c-selected-bg)',
          border: '2px solid var(--c2c-border)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          fontSize: '0.9rem',
          color: 'var(--c2c-text-secondary)',
          lineHeight: '1.5',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--c2c-green)', fontWeight: '600' }}>
            <span>💡</span> Missing collaborated or organization repositories?
          </div>
          <p style={{ margin: 0 }}>
            Because Code2Cloud integrates via a secure **GitHub App**, repositories only appear if the repository owner or organization administrator has **installed the GitHub App** on their namespace.
          </p>
          <div style={{ margin: 0, fontSize: '0.85rem' }}>
            <span style={{ color: '#fff', fontWeight: '500' }}>How to grant access:</span> Ask the repository owner to install the App on their account, or install it directly on your organization via the <a href="https://github.com/apps/code2cloud-dev/installations/new" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c2c-green)', textDecoration: 'underline', fontWeight: '600' }}>Code2Cloud GitHub App Settings</a>.
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      ) : error ? (
        <div style={{ background: 'rgba(255, 107, 107, 0.1)', border: '2px solid rgba(255, 107, 107, 0.3)', color: '#ff6b6b', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {repos.map((repo) => {
            const isCollaborator = repo.owner?.login?.toLowerCase() !== user?.login?.toLowerCase();
            return (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'var(--c2c-surface)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid var(--c2c-border)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.4)';
                  e.currentTarget.style.borderColor = 'var(--c2c-green)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--c2c-border)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--c2c-green)' }}>
                  <BookMarked size={18} style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexGrow: 1, overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#fff', wordBreak: 'break-all', lineHeight: '1.3' }}>
                      {repo.full_name}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end', flexShrink: 0 }}>
                    {repo.private ? (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', padding: '0.15rem 0.4rem', borderRadius: '6px', border: '2px solid rgba(255,107,107,0.3)', fontWeight: '600' }}>Private</span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.15rem 0.4rem', borderRadius: '6px', border: '2px solid rgba(16,185,129,0.3)', fontWeight: '600' }}>Public</span>
                    )}
                    {isCollaborator && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--c2c-green)', padding: '0.15rem 0.4rem', borderRadius: '6px', border: '2px solid rgba(16, 185, 129, 0.3)', fontWeight: '700', letterSpacing: '0.2px' }}>Collaborated</span>
                    )}
                  </div>
                </div>

                <p style={{ color: '#a2a2b5', fontSize: '0.9rem', marginBottom: '1.5rem', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {repo.description || 'No description provided.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: '#6e7191', marginTop: 'auto' }}>
                  {repo.language && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--c2c-green)' }}></span>
                      {repo.language}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={14} /> {repo.stargazers_count}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <GitFork size={14} /> {repo.forks_count}
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <ExternalLink size={14} />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}

export default Repos;
