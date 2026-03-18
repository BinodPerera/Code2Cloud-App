import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookMarked, Star, GitFork, ExternalLink, ArrowLeft } from 'lucide-react';

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
        // Fetching both public and private repos from backend proxy
        const response = await fetch('http://127.0.0.1:8000/api/v1/repos/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }
        const data = await response.json();
        // Sort by updated at, most recent first
        const sortedData = data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setRepos(sortedData);
      } catch (err) {
        setError('Error loading repositories. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [user]);

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
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a2a2b5', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
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
        <p style={{ color: '#a2a2b5', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Select a repository for <strong style={{ color: '#fff', fontWeight: '600' }}>{getServiceTitle()}</strong>
        </p>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      ) : error ? (
        <div style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.2)', color: '#ff6b6b', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {repos.map((repo) => (
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
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '1.5rem',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.4)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#5865F2' }}>
                <BookMarked size={18} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '500', margin: 0, color: '#fff', wordBreak: 'break-all', flexGrow: 1 }}>
                  {repo.name}
                </h3>
                {repo.private ? (
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,107,107,0.2)', flexShrink: 0 }}>Private</span>
                ) : (
                  <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', flexShrink: 0 }}>Public</span>
                )}
              </div>

              <p style={{ color: '#a2a2b5', fontSize: '0.9rem', marginBottom: '1.5rem', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {repo.description || 'No description provided.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: '#6e7191', marginTop: 'auto' }}>
                {repo.language && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#5865F2' }}></span>
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
          ))}
        </div>
      )}
    </>
  );
}

export default Repos;
