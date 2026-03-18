import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookMarked, ArrowLeft } from 'lucide-react';

function ServiceSetup() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  
  const [repos, setRepos] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [techStack, setTechStack] = useState(null);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingStack, setLoadingStack] = useState(false);
  const [error, setError] = useState('');
  const [selectedCloud, setSelectedCloud] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const serviceConfigs = {
    finops: {
      title: 'Cost Analysis (FinOps) Setup',
      description: 'Select a repository to begin scanning the infrastructure weight maps.',
      buttonText: 'Proceed to FinOps Diagnosis',
      color: '#00E5FF'
    },
    docker: {
      title: 'Docker Generation Setup',
      description: 'Select a repository to generate optimal container configurations.',
      buttonText: 'Proceed to Docker Generation',
      color: '#5865F2'
    },
    terraform: {
      title: 'Terraform Script Setup',
      description: 'Select a repository to generate production-ready Infrastructure as Code scripts.',
      buttonText: 'Proceed to Terraform Generation',
      color: '#10B981'
    }
  };

  const currentConfig = serviceConfigs[serviceId] || {
    title: 'Service Setup',
    description: 'Select a repository to configure your service pipeline.',
    buttonText: 'Proceed',
    color: '#fff'
  };

  // Fetch all repos first for dropdown loading sets
  useEffect(() => {
    const fetchRepos = async () => {
      if (!token) return;
      try {
        setLoadingRepos(true);
        const response = await fetch('http://127.0.0.1:8000/api/v1/repos/', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch repositories');
        const data = await response.json();
        setRepos(data);
      } catch (err) {
        setError('Error loading repositories. Please try again.');
        console.error(err);
      } finally {
        setLoadingRepos(false);
      }
    };
    fetchRepos();
  }, [token]);

  // Fetch tech stack when selected repo changes
  useEffect(() => {
    const fetchTechStack = async () => {
      if (!selectedRepo || !token) {
        setTechStack(null);
        return;
      }
      
      try {
        setLoadingStack(true);
        const owner = selectedRepo.owner?.login || selectedRepo.user?.login; 
        const repoName = selectedRepo.name;
        const res = await fetch(`http://127.0.0.1:8000/api/v1/repos/${owner}/${repoName}/tech-stack`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const stack = await res.json();
          setTechStack(stack);
        }
      } catch (err) {
        console.error("Failed to fetch tech stack", err);
      } finally {
        setLoadingStack(false);
      }
    };
    fetchTechStack();
  }, [selectedRepo, token]);

  const calculateLanguagePercentages = (langs) => {
    if (!langs || Object.keys(langs).length === 0) return [];
    const total = Object.values(langs).reduce((a, b) => a + b, 0);
    return Object.entries(langs).map(([name, bytes]) => ({
      name,
      percentage: ((bytes / total) * 100).toFixed(1)
    }));
  };

  const sortedRepos = [...repos].sort((a, b) => a.name.localeCompare(b.name));

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

      <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: currentConfig.color }}>
            {currentConfig.title}
          </h2>
          <p style={{ color: '#a2a2b5' }}>{currentConfig.description}</p>
        </div>

        {loadingRepos ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="loading-spinner" style={{ width: '32px', height: '32px' }}></div>
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.2)', color: '#ff6b6b', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: '#a2a2b5', fontSize: '0.95rem', fontWeight: '500' }}>Choose Repository</label>
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setIsOpen(!isOpen)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    color: '#fff',
                    padding: '1.2rem',
                    width: '100%',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = isOpen ? currentConfig.color : 'rgba(255,255,255,0.1)'; }}
                >
                  <span style={{ color: selectedRepo ? '#fff' : '#a2a2b5' }}>
                    {selectedRepo ? selectedRepo.name : '-- Select a repository --'}
                  </span>
                  <span style={{ color: '#a2a2b5', fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: 0,
                    right: 0,
                    background: '#0c0c12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    zIndex: 999,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    padding: '0.5rem'
                  }}>
                    {sortedRepos.map((repo) => (
                      <div 
                        key={repo.id}
                        onClick={() => {
                          setSelectedRepoId(repo.id.toString());
                          setSelectedRepo(repo);
                          setIsOpen(false);
                          setTechStack(null);
                        }}
                        style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          color: '#fff',
                          background: selectedRepoId === repo.id.toString() ? 'rgba(255,255,255,0.05)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '0.95rem' }}>{repo.name}</span>
                        {repo.private ? <span style={{ color: '#ff6b6b' }}>🔒</span> : <span style={{ color: '#10B981' }}>🌐</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedRepo && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: currentConfig.color }}>
                    <BookMarked size={24} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', margin: 0 }}>{selectedRepo.name}</h3>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                  <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Tech Stack Analytics</h4>
                  
                  {loadingStack ? (
                    <span>Analyzing dependencies...</span>
                  ) : techStack ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Languages */}
                      <div>
                        <span style={{ color: '#6e7191', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Languages Distribution</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {calculateLanguagePercentages(techStack.languages).map((l, i) => (
                            <span key={i} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                              {l.name} ({l.percentage}%)
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Components */}
                      <div>
                        <span style={{ color: '#6e7191', fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>Sub-Projects Detected</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {techStack.components && techStack.components.length > 0 ? (
                            techStack.components.map((comp, i) => (
                              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '1.2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: currentConfig.color, fontWeight: '600' }}>{comp.name}</span>
                                    <span style={{ color: '#6e7191', fontSize: '0.75rem' }}>({comp.type})</span>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '100px', overflowY: 'auto' }}>
                                  {comp.libraries.map((lib, j) => (
                                    <span key={j} style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e2e9', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>{lib}</span>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span style={{ color: '#a2a2b5', fontSize: '0.85rem' }}>None detected</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : <span>Unavailable</span>}
                </div>

                {/* Cloud Platform Selection */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>Where are you deploying this application?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {[{ id: 'AWS', name: 'AWS' }, { id: 'Azure', name: 'Azure' }, { id: 'GCP', name: 'Google Cloud' }].map((cloud) => (
                      <div 
                        key={cloud.id}
                        onClick={() => setSelectedCloud(cloud.id)}
                        style={{
                          background: selectedCloud === cloud.id ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                          border: selectedCloud === cloud.id ? `2px solid ${currentConfig.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '16px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ color: selectedCloud === cloud.id ? currentConfig.color : '#fff', fontWeight: '600' }}>{cloud.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => alert(`Starting ${currentConfig.title} on ${selectedCloud}`)}
                  disabled={!selectedCloud}
                  style={{
                    background: selectedCloud ? `linear-gradient(135deg, ${currentConfig.color}, #000)` : 'rgba(255,255,255,0.05)',
                    color: selectedCloud ? '#0a0a0f' : '#6e7191',
                    padding: '1.1rem', borderRadius: '16px', fontWeight: '700', cursor: selectedCloud ? 'pointer' : 'not-allowed'
                  }}
                >
                  {currentConfig.buttonText} →
                </button>

              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default ServiceSetup;
