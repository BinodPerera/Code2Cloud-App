import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookMarked, ArrowLeft } from 'lucide-react';
import { apiClient } from '../utils/api';
import Preloader from '../components/Preloader';

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
  
  // AWS target compute config states
  const [awsComputeChoice, setAwsComputeChoice] = useState('ec2');
  const [awsInstanceType, setAwsInstanceType] = useState('t3.micro');
  const [awsUseEip, setAwsUseEip] = useState(false);
  
  // GCP target compute config states
  const [gcpComputeChoice, setGcpComputeChoice] = useState('cloudrun');
  const [gcpMachineType, setGcpMachineType] = useState('e2-micro');
  const [gcpUseStaticIp, setGcpUseStaticIp] = useState(false);

  // Monorepo component-specific configurations: { [compName]: { awsComputeChoice, awsInstanceType, gcpComputeChoice, gcpMachineType } }
  const [componentConfigs, setComponentConfigs] = useState({});

  // Gemini AI Recommendation states
  const [recommendLoading, setRecommendLoading] = useState({});
  const [aiReasons, setAiReasons] = useState({});
  const [aiSources, setAiSources] = useState({});

  const serviceConfigs = {
    finops: {
      title: 'Cost Analysis (FinOps) Setup',
      description: 'Select a repository to begin scanning the infrastructure weight maps.',
      buttonText: 'Proceed to FinOps Diagnosis',
      color: '#059669'
    },
    docker: {
      title: 'Docker Generation Setup',
      description: 'Select a repository to generate optimal container configurations.',
      buttonText: 'Proceed to Docker Generation',
      color: '#34d399'
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

  // Sync componentConfigs state whenever techStack changes
  useEffect(() => {
    if (techStack?.components && techStack.components.length > 0) {
      const initialConfigs = {};
      techStack.components.forEach((comp) => {
        const compName = comp.name.toLowerCase().replace('/', '-').replace('\\', '-');
        initialConfigs[compName] = componentConfigs[compName] || {
          awsComputeChoice: awsComputeChoice,
          awsInstanceType: awsComputeChoice === 'fargate' ? '0.25 vCPU / 512 MB' : 't3.micro',
          awsUseEip: awsUseEip,
          gcpComputeChoice: gcpComputeChoice,
          gcpMachineType: gcpComputeChoice === 'cloudrun' ? '1 vCPU / 512 MB' : 'e2-micro',
          gcpUseStaticIp: gcpUseStaticIp
        };
      });
      setComponentConfigs(initialConfigs);
    }
  }, [techStack]);

  const fetchAiRecommendation = async (targetCloud, computeChoice, compName = 'global', compType = null) => {
    if (!targetCloud || !['AWS', 'GCP'].includes(targetCloud)) return;

    setRecommendLoading((prev) => ({ ...prev, [compName]: true }));

    try {
      const res = await apiClient.post('/repos/recommend-instance', {
        cloud: targetCloud,
        computeChoice: computeChoice,
        techStack: techStack,
        componentName: compName === 'global' ? null : compName,
        componentType: compType
      });

      if (res.ok) {
        const data = await res.json();
        const recommendedInstance = data.recommended_instance;
        const reasoning = data.reasoning;

        setAiReasons((prev) => ({ ...prev, [compName]: reasoning }));
        setAiSources((prev) => ({ ...prev, [compName]: data.source }));

        if (compName === 'global') {
          if (targetCloud === 'AWS') setAwsInstanceType(recommendedInstance);
          if (targetCloud === 'GCP') setGcpMachineType(recommendedInstance);
        } else {
          setComponentConfigs((prev) => {
            const current = prev[compName] || {};
            return {
              ...prev,
              [compName]: {
                ...current,
                ...(targetCloud === 'AWS' ? { awsInstanceType: recommendedInstance } : { gcpMachineType: recommendedInstance })
              }
            };
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch AI instance recommendation:", err);
    } finally {
      setRecommendLoading((prev) => ({ ...prev, [compName]: false }));
    }
  };

  useEffect(() => {
    if (!selectedCloud || !['AWS', 'GCP'].includes(selectedCloud) || !techStack) return;

    if (techStack.components && techStack.components.length > 1) {
      techStack.components.forEach((comp) => {
        const compName = comp.name.toLowerCase().replace('/', '-').replace('\\', '-');
        const currentChoice = selectedCloud === 'AWS' 
          ? (componentConfigs[compName]?.awsComputeChoice || awsComputeChoice)
          : (componentConfigs[compName]?.gcpComputeChoice || gcpComputeChoice);
        fetchAiRecommendation(selectedCloud, currentChoice, compName, comp.type);
      });
    } else {
      const currentChoice = selectedCloud === 'AWS' ? awsComputeChoice : gcpComputeChoice;
      fetchAiRecommendation(selectedCloud, currentChoice, 'global', techStack.primary_language);
    }
  }, [selectedCloud, techStack]);

  const renderAiReasoning = (compKey = 'global') => {
    const isLoading = recommendLoading[compKey];
    const reasoning = aiReasons[compKey];
    const source = aiSources[compKey];

    if (isLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.6rem', color: '#10B981', fontSize: '0.8rem', width: '100%' }}>
          <div className="loading-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: '#10B981' }}></div>
          <span>Gemini AI selecting best instance...</span>
        </div>
      );
    }

    if (reasoning) {
      return (
        <div style={{
          marginTop: '0.75rem',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          fontSize: '0.82rem',
          color: '#e2e2e9',
          lineHeight: '1.45',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', fontWeight: '600', marginBottom: '0.3rem' }}>
            <span>✨ AI Recommendation</span>
            {source === 'gemini' && (
              <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Gemini AI</span>
            )}
          </div>
          <div>{reasoning}</div>
        </div>
      );
    }

    return null;
  };


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
        techStack,
        awsComputeChoice,
        awsInstanceType,
        awsUseEip,
        gcpComputeChoice,
        gcpMachineType,
        gcpUseStaticIp,
        componentConfigs
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
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '2px solid var(--c2c-border)', color: '#a2a2b5', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
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
          <div style={{ background: 'rgba(255, 107, 107, 0.1)', border: '2px solid rgba(255, 107, 107, 0.3)', color: '#ff6b6b', padding: '1.2rem', borderRadius: '12px', textAlign: 'center' }}>
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
                    background: 'var(--c2c-surface)',
                    backdropFilter: 'blur(20px)',
                    border: '2px solid var(--c2c-border)',
                    borderRadius: '16px',
                    color: 'var(--c2c-text-primary)',
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
                    background: 'var(--c2c-surface)',
                    border: '2px solid var(--c2c-border)',
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
                                  background: selectedRepoId === repo.id.toString() ? 'var(--c2c-selected-bg)' : 'transparent',
                                  transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => { if (selectedRepoId !== repo.id.toString()) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'; }}
                                onMouseOut={(e) => { if (selectedRepoId !== repo.id.toString()) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <span style={{ fontSize: '0.95rem' }}>{repo.full_name}</span>
                                  {isCollaborator && (
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--c2c-green)', padding: '0.1rem 0.35rem', borderRadius: '4px', border: '2px solid rgba(16, 185, 129, 0.3)', fontWeight: '600' }}>Collaborated</span>
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
                  style={{ fontSize: '0.8rem', color: 'var(--c2c-green)', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Missing organization/shared repos? Grant access
                </a>
              </div>
            </div>

            {selectedRepo && (
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '2px solid var(--c2c-border)', borderRadius: '24px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: currentConfig.color }}>
                    <BookMarked size={24} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', margin: 0 }}>{selectedRepo.full_name}</h3>
                  </div>
                </div>

                <div style={{ borderTop: '2px solid var(--c2c-border)', paddingTop: '1.5rem' }}>
                  <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Tech Stack Analytics</h4>
                  
                  {loadingStack ? (
                    <Preloader 
                      message="Analyzing your repository..." 
                      submessage="Scanning configuration files, mapping dependencies, and identifying sub-project components." 
                      color={currentConfig.color}
                    />
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
                              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '14px', padding: '1.2rem' }}>
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
                  <div style={{ borderTop: '2px solid var(--c2c-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>Where are you deploying this application?</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      {[{ id: 'AWS', name: 'AWS' }, { id: 'Azure', name: 'Azure' }, { id: 'GCP', name: 'Google Cloud' }].map((cloud) => (
                        <div 
                          key={cloud.id}
                          onClick={() => setSelectedCloud(cloud.id)}
                          style={{
                              background: selectedCloud === cloud.id ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                              border: selectedCloud === cloud.id ? `2px solid ${currentConfig.color}` : '2px solid var(--c2c-border)',
                            borderRadius: '16px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ color: selectedCloud === cloud.id ? currentConfig.color : '#fff', fontWeight: '600' }}>{cloud.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                 )}

                 {/* Monorepo Per-Component Sizing & Resource Selection */}
                 {serviceId === 'terraform' && selectedCloud && techStack?.components && techStack.components.length > 1 && (
                   <div style={{ borderTop: '2px solid var(--c2c-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                       <label style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>Monorepo Component Sizing & Resource Selection</label>
                       <span style={{ color: '#a2a2b5', fontSize: '0.8rem' }}>
                         Multiple components detected ({techStack.components.map(c => c.name).join(', ')}). Select instance or resource sizing individually for each component.
                       </span>
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                       {techStack.components.map((comp) => {
                         const rawName = comp.name || 'app';
                         const compName = rawName.toLowerCase().replace('/', '-').replace('\\', '-');
                         const compCfg = componentConfigs[compName] || {
                           awsComputeChoice: awsComputeChoice,
                           awsInstanceType: awsComputeChoice === 'fargate' ? '0.25 vCPU / 512 MB' : 't3.micro',
                           awsUseEip: awsUseEip,
                           gcpComputeChoice: gcpComputeChoice,
                           gcpMachineType: gcpComputeChoice === 'cloudrun' ? '1 vCPU / 512 MB' : 'e2-micro',
                           gcpUseStaticIp: gcpUseStaticIp
                         };

                          const updateCompCfg = (key, val) => {
                            setComponentConfigs((prev) => {
                              const current = prev[compName] || compCfg;
                              return {
                                ...prev,
                                [compName]: {
                                  ...current,
                                  [key]: val
                                }
                              };
                            });
                          };

                         return (
                           <div key={compName} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1.5px solid var(--c2c-border)', borderRadius: '16px', padding: '1.25rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                 <span style={{ color: currentConfig.color, fontWeight: '700', fontSize: '1rem', textTransform: 'capitalize' }}>{comp.name} Component</span>
                                 <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '0.2rem 0.6rem', borderRadius: '8px', color: '#a2a2b5', fontSize: '0.75rem' }}>{comp.type}</span>
                               </div>
                               <span style={{ color: '#6b7280', fontSize: '0.75rem', fontFamily: 'monospace' }}>path: {comp.path}</span>
                             </div>

                             {/* AWS Per-Component Configs */}
                             {selectedCloud === 'AWS' && (
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                     <label style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>Compute Target</label>
                                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                       {[
                                         { id: 'fargate', name: 'ECS Fargate' },
                                         { id: 'ec2', name: 'EC2 Instance' }
                                       ].map((target) => (
                                         <div
                                           key={target.id}
                                           onClick={() => {
                                             updateCompCfg('awsComputeChoice', target.id);
                                             updateCompCfg('awsInstanceType', target.id === 'fargate' ? '0.25 vCPU / 512 MB' : 't3.micro');
                                             fetchAiRecommendation('AWS', target.id, compName, comp.type);
                                           }}
                                           style={{
                                             background: compCfg.awsComputeChoice === target.id ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                                             border: compCfg.awsComputeChoice === target.id ? `2px solid ${currentConfig.color}` : '1.5px solid var(--c2c-border)',
                                             borderRadius: '10px',
                                             padding: '0.65rem 0.5rem',
                                             textAlign: 'center',
                                             cursor: 'pointer',
                                             fontWeight: '600',
                                             fontSize: '0.85rem',
                                             color: compCfg.awsComputeChoice === target.id ? currentConfig.color : '#fff',
                                             transition: 'all 0.2s',
                                             userSelect: 'none'
                                           }}
                                         >
                                           {target.name}
                                         </div>
                                       ))}
                                     </div>
                                   </div>

                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                     <label style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>Instance / Resource Size</label>
                                     <select
                                       value={compCfg.awsInstanceType}
                                       onChange={(e) => updateCompCfg('awsInstanceType', e.target.value)}
                                       style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.65rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                                     >
                                       {compCfg.awsComputeChoice === 'fargate' ? (
                                         <>
                                           <option value="0.25 vCPU / 512 MB" style={{ background: '#0f0f15', color: '#fff' }}>0.25 vCPU / 512 MB (Default)</option>
                                           <option value="0.5 vCPU / 1 GB" style={{ background: '#0f0f15', color: '#fff' }}>0.5 vCPU / 1 GB</option>
                                           <option value="1.0 vCPU / 2 GB" style={{ background: '#0f0f15', color: '#fff' }}>1.0 vCPU / 2 GB</option>
                                         </>
                                       ) : (
                                         <>
                                           <option value="t3.micro" style={{ background: '#0f0f15', color: '#fff' }}>t3.micro (1 vCPU / 1 GB - Free Tier)</option>
                                           <option value="t3.small" style={{ background: '#0f0f15', color: '#fff' }}>t3.small (2 vCPU / 2 GB)</option>
                                           <option value="t3.medium" style={{ background: '#0f0f15', color: '#fff' }}>t3.medium (2 vCPU / 4 GB)</option>
                                         </>
                                       )}
                                     </select>
                                   </div>
                                 </div>
                                 {compCfg.awsComputeChoice === 'ec2' && (
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                     <input
                                       type="checkbox"
                                       id={`awsUseEip-${compName}`}
                                       checked={compCfg.awsUseEip || false}
                                       onChange={(e) => updateCompCfg('awsUseEip', e.target.checked)}
                                       style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: currentConfig.color }}
                                     />
                                     <label htmlFor={`awsUseEip-${compName}`} style={{ color: '#fff', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                                       Allocate Elastic IP (Static Public IP)
                                     </label>
                                   </div>
                                 )}
                                 {renderAiReasoning(compName)}
                               </div>
                             )}

                             {/* GCP Per-Component Configs */}
                             {selectedCloud === 'GCP' && (
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                     <label style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>Compute Target</label>
                                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                       {[
                                         { id: 'cloudrun', name: 'Cloud Run' },
                                         { id: 'gce', name: 'Compute Engine' }
                                       ].map((target) => (
                                         <div
                                           key={target.id}
                                           onClick={() => {
                                             updateCompCfg('gcpComputeChoice', target.id);
                                             updateCompCfg('gcpMachineType', target.id === 'cloudrun' ? '1 vCPU / 512 MB' : 'e2-micro');
                                             fetchAiRecommendation('GCP', target.id, compName, comp.type);
                                           }}
                                           style={{
                                             background: compCfg.gcpComputeChoice === target.id ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                                             border: compCfg.gcpComputeChoice === target.id ? `2px solid ${currentConfig.color}` : '1.5px solid var(--c2c-border)',
                                             borderRadius: '10px',
                                             padding: '0.65rem 0.5rem',
                                             textAlign: 'center',
                                             cursor: 'pointer',
                                             fontWeight: '600',
                                             fontSize: '0.85rem',
                                             color: compCfg.gcpComputeChoice === target.id ? currentConfig.color : '#fff',
                                             transition: 'all 0.2s',
                                             userSelect: 'none'
                                           }}
                                         >
                                           {target.name}
                                         </div>
                                       ))}
                                     </div>
                                   </div>

                                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                     <label style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>Instance / Machine Type</label>
                                     <select
                                       value={compCfg.gcpMachineType}
                                       onChange={(e) => updateCompCfg('gcpMachineType', e.target.value)}
                                       style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.65rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                                     >
                                       {compCfg.gcpComputeChoice === 'cloudrun' ? (
                                         <>
                                           <option value="1 vCPU / 512 MB" style={{ background: '#0f0f15', color: '#fff' }}>1 vCPU / 512 MB (Default)</option>
                                           <option value="1 vCPU / 1 GB" style={{ background: '#0f0f15', color: '#fff' }}>1 vCPU / 1 GB</option>
                                           <option value="2 vCPU / 2 GB" style={{ background: '#0f0f15', color: '#fff' }}>2 vCPU / 2 GB</option>
                                         </>
                                       ) : (
                                         <>
                                           <option value="e2-micro" style={{ background: '#0f0f15', color: '#fff' }}>e2-micro (2 vCPU / 1 GB - Free Tier)</option>
                                           <option value="e2-small" style={{ background: '#0f0f15', color: '#fff' }}>e2-small (2 vCPU / 2 GB)</option>
                                           <option value="e2-medium" style={{ background: '#0f0f15', color: '#fff' }}>e2-medium (2 vCPU / 4 GB)</option>
                                         </>
                                       )}
                                     </select>
                                   </div>
                                 </div>
                                 {compCfg.gcpComputeChoice === 'gce' && (
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                     <input
                                       type="checkbox"
                                       id={`gcpUseStaticIp-${compName}`}
                                       checked={compCfg.gcpUseStaticIp || false}
                                       onChange={(e) => updateCompCfg('gcpUseStaticIp', e.target.checked)}
                                       style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: currentConfig.color }}
                                     />
                                     <label htmlFor={`gcpUseStaticIp-${compName}`} style={{ color: '#fff', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                                       Reserve Static External IP Address
                                     </label>
                                   </div>
                                 )}
                                 {renderAiReasoning(compName)}
                               </div>
                             )}
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}

                 {/* Single Component AWS Compute & Network Configurations */}
                 {selectedCloud === 'AWS' && serviceId === 'terraform' && (!techStack?.components || techStack.components.length <= 1) && (
                   <div style={{ borderTop: '2px solid var(--c2c-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                       <label style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>AWS Compute Choice</label>
                       <span style={{ color: '#a2a2b5', fontSize: '0.8rem' }}>Choose between standard virtual machines or container orchestration.</span>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                       {[
                         { id: 'fargate', name: 'ECS Fargate (Container)', desc: 'Deploy serverless docker container stacks.' },
                         { id: 'ec2', name: 'EC2 Instance (VM)', desc: 'Deploy app on a single AWS virtual server instance.' }
                       ].map((target) => (
                         <div
                           key={target.id}
                           onClick={() => {
                             setAwsComputeChoice(target.id);
                             setAwsInstanceType(target.id === 'fargate' ? '0.25 vCPU / 512 MB' : 't3.micro');
                             fetchAiRecommendation('AWS', target.id, 'global');
                           }}
                           style={{
                              background: awsComputeChoice === target.id ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                              border: awsComputeChoice === target.id ? `2px solid ${currentConfig.color}` : '2px solid var(--c2c-border)',
                             borderRadius: '16px', padding: '1.25rem 1rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                           }}
                         >
                           <div style={{ color: awsComputeChoice === target.id ? currentConfig.color : '#fff', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>{target.name}</div>
                           <div style={{ color: '#a2a2b5', fontSize: '0.75rem', lineHeight: '1.3' }}>{target.desc}</div>
                         </div>
                       ))}
                     </div>
                     
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                         <label style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '600' }}>Resource Size / Sizing</label>
                         <select
                           value={awsInstanceType}
                           onChange={(e) => setAwsInstanceType(e.target.value)}
                           style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.75rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                         >
                           {awsComputeChoice === 'fargate' ? (
                             <>
                               <option value="0.25 vCPU / 512 MB" style={{ background: '#0f0f15' }}>0.25 vCPU / 512 MB (Default)</option>
                               <option value="0.5 vCPU / 1 GB" style={{ background: '#0f0f15' }}>0.5 vCPU / 1 GB</option>
                               <option value="1.0 vCPU / 2 GB" style={{ background: '#0f0f15' }}>1.0 vCPU / 2 GB</option>
                             </>
                           ) : (
                             <>
                               <option value="t3.micro" style={{ background: '#0f0f15' }}>t3.micro (1 vCPU / 1 GB - Free Tier)</option>
                               <option value="t3.small" style={{ background: '#0f0f15' }}>t3.small (2 vCPU / 2 GB)</option>
                               <option value="t3.medium" style={{ background: '#0f0f15' }}>t3.medium (2 vCPU / 4 GB)</option>
                             </>
                           )}
                         </select>
                       </div>

                       {awsComputeChoice === 'ec2' && (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                           <input
                             type="checkbox"
                             id="awsUseEip"
                             checked={awsUseEip}
                             onChange={(e) => setAwsUseEip(e.target.checked)}
                             style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: currentConfig.color }}
                           />
                           <label htmlFor="awsUseEip" style={{ color: '#fff', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                             Allocate Elastic IP (Static Public IP)
                           </label>
                         </div>
                       )}
                     </div>
                     {renderAiReasoning('global')}
                   </div>
                 )}

                 {/* Single Component GCP Compute & Network Configurations */}
                 {selectedCloud === 'GCP' && serviceId === 'terraform' && (!techStack?.components || techStack.components.length <= 1) && (
                   <div style={{ borderTop: '2px solid var(--c2c-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                       <label style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>Google Cloud Compute Choice</label>
                       <span style={{ color: '#a2a2b5', fontSize: '0.8rem' }}>Choose serverless Cloud Run scaling or dedicated Compute Engine VMs.</span>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                       {[
                         { id: 'cloudrun', name: 'Cloud Run (Serverless)', desc: 'Run serverless containers scale-to-zero.' },
                         { id: 'gce', name: 'Compute Engine (VM)', desc: 'Run containers on GCE virtual machine hosts.' }
                       ].map((target) => (
                         <div
                           key={target.id}
                           onClick={() => {
                             setGcpComputeChoice(target.id);
                             setGcpMachineType(target.id === 'cloudrun' ? '1 vCPU / 512 MB' : 'e2-micro');
                             fetchAiRecommendation('GCP', target.id, 'global');
                           }}
                           style={{
                              background: gcpComputeChoice === target.id ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                              border: gcpComputeChoice === target.id ? `2px solid ${currentConfig.color}` : '2px solid var(--c2c-border)',
                             borderRadius: '16px', padding: '1.25rem 1rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                           }}
                         >
                           <div style={{ color: gcpComputeChoice === target.id ? currentConfig.color : '#fff', fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>{target.name}</div>
                           <div style={{ color: '#a2a2b5', fontSize: '0.75rem', lineHeight: '1.3' }}>{target.desc}</div>
                         </div>
                       ))}
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                         <label style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '600' }}>Resource Size / Sizing</label>
                         <select
                           value={gcpMachineType}
                           onChange={(e) => setGcpMachineType(e.target.value)}
                           style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '12px', color: '#fff', padding: '0.75rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                         >
                           {gcpComputeChoice === 'cloudrun' ? (
                             <>
                               <option value="1 vCPU / 512 MB" style={{ background: '#0f0f15' }}>1 vCPU / 512 MB (Default)</option>
                               <option value="1 vCPU / 1 GB" style={{ background: '#0f0f15' }}>1 vCPU / 1 GB</option>
                               <option value="2 vCPU / 2 GB" style={{ background: '#0f0f15' }}>2 vCPU / 2 GB</option>
                             </>
                           ) : (
                             <>
                               <option value="e2-micro" style={{ background: '#0f0f15' }}>e2-micro (2 vCPU / 1 GB - Free Tier)</option>
                               <option value="e2-small" style={{ background: '#0f0f15' }}>e2-small (2 vCPU / 2 GB)</option>
                               <option value="e2-medium" style={{ background: '#0f0f15' }}>e2-medium (2 vCPU / 4 GB)</option>
                             </>
                           )}
                         </select>
                       </div>

                       {gcpComputeChoice === 'gce' && (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                           <input
                             type="checkbox"
                             id="gcpUseStaticIp"
                             checked={gcpUseStaticIp}
                             onChange={(e) => setGcpUseStaticIp(e.target.checked)}
                             style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: currentConfig.color }}
                           />
                           <label htmlFor="gcpUseStaticIp" style={{ color: '#fff', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                             Reserve Static External IP Address
                           </label>
                         </div>
                       )}
                     </div>
                     {renderAiReasoning('global')}
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
