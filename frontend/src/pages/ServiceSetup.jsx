import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookMarked, ArrowLeft } from 'lucide-react';
import { apiClient } from '../utils/api';

function ServiceSetup() {
  const { user, token } = useAuth();
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
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
        const response = await apiClient.get('/repos/');
        const data = await response.json();
        setRepos(data);
      } catch (err) {
        if (err.message !== 'Unauthorized') {
          setError('Error loading repositories. Please try again.');
          console.error(err);
        }
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
        const res = await apiClient.get(`/repos/${owner}/${repoName}/tech-stack`);
        if (res.ok) {
          const stack = await res.json();
          setTechStack(stack);
        }
      } catch (err) {
        if (err.message !== 'Unauthorized') {
          console.error("Failed to fetch tech stack", err);
        }
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

  const handleProceed = async () => {
    if (!selectedRepo || (serviceId !== 'docker' && !selectedCloud) || !token) return;
    try {
      setGenerating(true);
      const owner = selectedRepo.owner?.login || selectedRepo.user?.login;
      const repoName = selectedRepo.name;
      const res = await apiClient.post(`/repos/${owner}/${repoName}/generate`, {
        serviceId,
        cloud: serviceId === 'docker' ? 'None' : selectedCloud,
        techStack
      });
      if (!res.ok) {
        throw new Error("Failed to generate deployment scripts");
      }
      const data = await res.json();
      navigate(`/generation/${data.generation_id}`);
    } catch (err) {
      alert(err.message || "An error occurred during code generation.");
    } finally {
      setGenerating(false);
    }
  };

  const sortedRepos = [...repos].sort((a, b) => a.full_name.localeCompare(b.full_name));

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
              <div style={{ position: 'relative', zIndex: 995 }}>
                {/* Click-outside capture overlay */}
                {isOpen && (
                  <div 
                    onClick={() => {
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 990, cursor: 'default' }}
                  />
                )}

                <input
                  type="text"
                  value={isOpen ? searchQuery : (selectedRepo ? selectedRepo.full_name : '')}
                  placeholder="-- Type to search or choose repository --"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsOpen(true);
                    if (e.target.value === '') {
                      setSelectedRepo(null);
                      setSelectedRepoId('');
                      setTechStack(null);
                    }
                  }}
                  onFocus={() => {
                    setIsOpen(true);
                    if (selectedRepo) {
                      setSearchQuery(selectedRepo.full_name);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    color: '#fff',
                    padding: '1.2rem',
                    paddingRight: '3.5rem',
                    width: '100%',
                    fontSize: '1.1rem',
                    outline: 'none',
                    cursor: 'text',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = isOpen ? currentConfig.color : 'rgba(255,255,255,0.1)'; }}
                />

                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                    if (isOpen) setSearchQuery('');
                  }}
                  style={{
                    position: 'absolute',
                    right: '1.2rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#a2a2b5',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    zIndex: 996
                  }}
                >
                  {isOpen ? '▲' : '▼'}
                </span>

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
                    zIndex: 999,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', overflowY: 'auto', maxHeight: '220px' }}>
                      {sortedRepos.filter(repo => repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div style={{ padding: '1rem', color: '#6e7191', fontSize: '0.95rem', textAlign: 'center' }}>
                          No repositories found
                        </div>
                      ) : (
                        sortedRepos
                          .filter(repo => repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((repo) => {
                            const isCollaborator = repo.owner?.login?.toLowerCase() !== user?.login?.toLowerCase();
                            return (
                              <div 
                                key={repo.id}
                                onClick={() => {
                                  setSelectedRepoId(repo.id.toString());
                                  setSelectedRepo(repo);
                                  setIsOpen(false);
                                  setTechStack(null);
                                  setSearchQuery(''); // Reset query on select
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
                                onMouseOver={(e) => { if (selectedRepoId !== repo.id.toString()) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                onMouseOut={(e) => { if (selectedRepoId !== repo.id.toString()) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <span style={{ fontSize: '0.95rem' }}>{repo.full_name}</span>
                                  {isCollaborator && (
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(0,229,255,0.1)', color: '#00E5FF', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(0,229,255,0.2)', fontWeight: '600' }}>Collaborated</span>
                                  )}
                                </div>
                                {repo.private ? <span style={{ color: '#ff6b6b' }}>🔒</span> : <span style={{ color: '#10B981' }}>🌐</span>}
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#6e7191' }}>
                  Type owner or repository name to search.
                </span>
                <a 
                  href="https://github.com/apps/code2cloud-dev/installations/new" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ fontSize: '0.8rem', color: '#00E5FF', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Missing organization/shared repos? Grant access
                </a>
              </div>
            </div>

            {selectedRepo && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: currentConfig.color }}>
                    <BookMarked size={24} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', margin: 0 }}>{selectedRepo.full_name}</h3>
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
                {serviceId !== 'docker' && (
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
                )}

                <button 
                  onClick={handleProceed}
                  disabled={serviceId === 'docker' ? (generating || loadingStack) : (!selectedCloud || generating || loadingStack)}
                  style={{
                    background: (serviceId === 'docker' ? (!generating && !loadingStack) : (selectedCloud && !generating && !loadingStack))
                      ? `linear-gradient(135deg, ${currentConfig.color}, #000)` 
                      : 'rgba(255,255,255,0.05)',
                    color: (serviceId === 'docker' ? (!generating && !loadingStack) : (selectedCloud && !generating && !loadingStack))
                      ? '#0a0a0f' 
                      : '#6e7191',
                    padding: '1.1rem', borderRadius: '16px', fontWeight: '700', 
                    cursor: (serviceId === 'docker' ? (!generating && !loadingStack) : (selectedCloud && !generating && !loadingStack))
                      ? 'pointer' 
                      : 'not-allowed',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', border: 'none'
                  }}
                >
                  {loadingStack ? 'Analyzing your tech stack...' : generating ? 'Generating your scripts...' : `${currentConfig.buttonText} →`}
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
