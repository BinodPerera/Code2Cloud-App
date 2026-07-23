import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, CloudLightning, Play, AlertCircle, FileCode, Search, RefreshCw } from 'lucide-react';
import { apiClient } from '../utils/api';
import Preloader from '../components/Preloader';
import EnvVariablesEditor from '../components/EnvVariablesEditor';

export default function DirectDeployWizard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [repos, setRepos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingStack, setLoadingStack] = useState(false);
  const [error, setError] = useState('');

  // Tech stack analysis result
  const [techStack, setTechStack] = useState(null);
  const [componentsConfig, setComponentsConfig] = useState([]);

  // Cloud & Compute Selection states
  const [selectedCloud, setSelectedCloud] = useState('aws');
  const [awsComputeChoice, setAwsComputeChoice] = useState('fargate');
  const [awsInstanceType, setAwsInstanceType] = useState('t3.micro');
  const [gcpComputeChoice, setGcpComputeChoice] = useState('cloudrun');
  const [gcpMachineType, setGcpMachineType] = useState('e2-micro');
  const [registryType, setRegistryType] = useState('native');
  const [savedCredentials, setSavedCredentials] = useState([]);
  const [selectedCloudCred, setSelectedCloudCred] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);

  // Commit & Deployment state
  const [commitBranch, setCommitBranch] = useState('code2cloud-setup');
  const [commitMessage, setCommitMessage] = useState('ci: direct deploy pipeline configured via Code2Cloud');
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const [workflowRun, setWorkflowRun] = useState(null);
  const [pollingRun, setPollingRun] = useState(false);

  const getOwnerAndRepo = (repo) => {
    if (!repo) return { owner: '', repoName: '' };
    const owner = repo.owner?.login || repo.user?.login || (repo.full_name ? repo.full_name.split('/')[0] : '');
    const repoName = repo.name || (repo.full_name ? repo.full_name.split('/')[1] : '');
    return { owner, repoName };
  };

  // Fetch repositories
  useEffect(() => {
    async function fetchRepos() {
      if (!token) return;
      try {
        setLoadingRepos(true);
        const res = await apiClient.get('/repos/');
        if (res.ok) {
          const data = await res.json();
          const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)) : [];
          setRepos(sorted);
        } else {
          setError('Failed to load repositories from GitHub.');
        }
      } catch (err) {
        setError('Failed to fetch repositories.');
      } finally {
        setLoadingRepos(false);
      }
    }
    fetchRepos();
  }, [token]);

  // Fetch saved credential profiles
  useEffect(() => {
    async function fetchCredentials() {
      if (!token) return;
      try {
        const res = await apiClient.get('/credentials/');
        if (res.ok) {
          const data = await res.json();
          setSavedCredentials(data);
        }
      } catch (err) {
        console.error('Failed to load credential profiles:', err);
      }
    }
    fetchCredentials();
  }, [token]);

  // Auto-select matching credential profile when selected cloud platform changes
  useEffect(() => {
    const matching = savedCredentials.filter(c => c.provider === selectedCloud.toLowerCase());
    if (matching.length > 0) {
      setSelectedCloudCred(matching[0].credential_id);
    } else {
      setSelectedCloudCred('');
    }
  }, [selectedCloud, savedCredentials]);

  // Fetch tech stack when selected repo changes
  const handleSelectRepo = async (repo) => {
    setSelectedRepo(repo);
    setError('');
    const { owner, repoName } = getOwnerAndRepo(repo);

    if (!owner || !repoName) {
      setError('Unable to parse repository owner/name.');
      return;
    }

    try {
      setLoadingStack(true);
      const res = await apiClient.get(`/repos/${owner}/${repoName}/tech-stack`);
      let stack = null;
      if (res.ok) {
        stack = await res.json();
      }
      setTechStack(stack);

      let comps = (stack && stack.components && stack.components.length > 0)
        ? stack.components
        : [{ name: repoName || 'app', path: '.', type: 'NodeJS / Javascript', has_dockerfile: false, env_keys: [] }];

      if (comps.length > 1) {
        const subfolderComps = comps.filter(c => c.path && c.path !== '.' && c.path !== '' && c.path.includes('/'));
        if (subfolderComps.length > 0) {
          comps = subfolderComps;
        }
      }

      setComponentsConfig(comps.map(c => ({
        ...c,
        instance_type: selectedCloud === 'aws' ? 't3.micro' : 'e2-micro',
        user_dockerfile_choice: c.has_dockerfile ? 'reuse' : 'generate'
      })));
    } catch (err) {
      console.error('Error analyzing repository tech stack:', err);
      // Fallback component
      setComponentsConfig([{ name: repoName || 'app', path: '.', type: 'NodeJS / Javascript', has_dockerfile: false, env_keys: [] }]);
    } finally {
      setLoadingStack(false);
    }
  };

  const handleComponentOptionChange = (index, field, val) => {
    setComponentsConfig(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const { owner, repoName } = getOwnerAndRepo(selectedRepo);

  // Trigger Backend Generation for Direct Deploy
  const handleGenerateConfig = async () => {
    if (!selectedRepo || !owner || !repoName) {
      setError('Please select a repository first.');
      return;
    }

    try {
      setGenerating(true);
      setError('');

      const body = {
        serviceId: 'direct_deploy',
        cloud: selectedCloud,
        registryType: registryType,
        awsComputeChoice,
        awsInstanceType,
        awsUseEip: false,
        gcpComputeChoice,
        gcpMachineType,
        gcpUseStaticIp: false,
        techStack: {
          ...techStack,
          components: componentsConfig
        }
      };

      const res = await apiClient.post(`/repos/${owner}/${repoName}/generate`, body);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to generate deployment configurations');
      }

      const result = await res.json();
      setGenerationResult(result);
      setCurrentStep(4); // Advance to Environment Variables Step
    } catch (err) {
      setError(err.message || 'Error generating deployment code.');
    } finally {
      setGenerating(false);
    }
  };

  // Perform Atomic Commit & Deploy
  const handleCommitAndDeploy = async () => {
    if (!generationResult || !generationResult.generation_id) return;
    try {
      // Push selected cloud credentials to GitHub Secrets before committing
      if (selectedCloudCred && owner && repoName) {
        try {
          const pushRes = await apiClient.post(`/repos/${owner}/${repoName}/secrets/push-saved`, {
            credential_ids: [selectedCloudCred]
          });
          if (!pushRes.ok) {
            const pushErr = await pushRes.json();
            console.warn('Warning: Failed to push cloud credentials to GitHub Secrets:', pushErr.detail);
          }
        } catch (secretErr) {
          console.warn('Warning: Secret push failed:', secretErr);
        }
      }

      const res = await apiClient.post(`/repos/generations/${generationResult.generation_id}/commit`, {
        branch: commitBranch,
        commit_message: commitMessage
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to commit deployment configurations');
      }

      const data = await res.json();
      setCommitResult(data);
      setCurrentStep(6); // Move to Step 6: Live Monitoring
      setPollingRun(true);
    } catch (err) {
      setError(err.message || 'Error committing deployment files to GitHub.');
    } finally {
      setCommitting(false);
    }
  };

  // Poll GitHub Actions Workflow Runs in Step 6
  useEffect(() => {
    let timer;
    if (pollingRun && owner && repoName) {
      const poll = async () => {
        try {
          const res = await apiClient.get(`/repos/${owner}/${repoName}/actions/runs?branch=${commitBranch}`);
          if (res.ok) {
            const data = await res.json();
            if (data.latest_run) {
              setWorkflowRun(data.latest_run);
              if (['completed', 'success', 'failure'].includes(data.latest_run.status)) {
                setPollingRun(false);
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      poll();
      timer = setInterval(poll, 4000);
    }
    return () => clearInterval(timer);
  }, [pollingRun, owner, repoName, commitBranch]);

  const filteredRepos = repos.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.full_name && r.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const steps = [
    { num: 1, title: 'Repository' },
    { num: 2, title: 'Cloud & Sizing' },
    { num: 3, title: 'Docker Setup' },
    { num: 4, title: 'Env Secrets' },
    { num: 5, title: 'Review Pipeline' },
    { num: 6, title: 'Deploy Status' }
  ];

  return (
    <div style={{ backgroundColor: '#09090b', minHeight: '100vh', color: '#fff', padding: '2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/services')} style={{ backgroundColor: '#18181b', color: '#fff', border: '1px solid #27272a', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Back to Services
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: '#10B981', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CloudLightning size={24} /> Direct Cloud Deployment Wizard
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: '0.9rem' }}>
              Deploy your application directly to cloud infrastructure with automated GitHub Actions CI/CD.
            </p>
          </div>
        </div>

        {/* Stepper Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#18181b', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #27272a', marginBottom: '2rem' }}>
          {steps.map(s => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;
            return (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem',
                  backgroundColor: isDone ? '#10B981' : isActive ? '#3b82f6' : '#27272a',
                  color: isDone ? '#000' : '#fff'
                }}>
                  {isDone ? <Check size={16} /> : s.num}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: isActive ? '600' : '400', color: isActive ? '#fff' : isDone ? '#10B981' : '#71717a' }}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Step 1: Select Repository */}
        {currentStep === 1 && (
          <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#fff' }}>Step 1: Select Target Repository</h2>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                <input
                  type="text"
                  placeholder="Search repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#09090b', color: '#fff', border: '1px solid #27272a', borderRadius: '6px', padding: '6px 12px 6px 32px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {loadingRepos ? (
              <Preloader message="Loading your repositories from GitHub..." />
            ) : filteredRepos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a', fontSize: '0.9rem' }}>
                No repositories found matching "{searchQuery}".
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredRepos.map(r => {
                  const isSelected = selectedRepo?.id === r.id;
                  const rOwner = r.owner?.login || r.user?.login || (r.full_name ? r.full_name.split('/')[0] : '');
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleSelectRepo(r)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#09090b',
                        border: isSelected ? '2px solid #10B981' : '1px solid #27272a',
                        borderRadius: '8px', padding: '1rem', cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>{r.name}</div>
                        {isSelected && <Check size={18} color="#10B981" />}
                      </div>
                      <div style={{ color: '#71717a', fontSize: '0.8rem', marginTop: '4px' }}>{rOwner} / {r.name}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {loadingStack && (
              <div style={{ marginTop: '1.5rem' }}>
                <Preloader message="Scanning repository components, Dockerfiles, and .env.example templates..." />
              </div>
            )}

            {selectedRepo && !loadingStack && (
              <div style={{ marginTop: '1.5rem', backgroundColor: '#09090b', padding: '1rem', borderRadius: '8px', border: '1px solid #10B981' }}>
                <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                  ✓ Selected: {owner}/{repoName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                  Detected {componentsConfig.length} component(s): {componentsConfig.map(c => c.name).join(', ')}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                disabled={!selectedRepo || loadingStack}
                onClick={() => setCurrentStep(2)}
                style={{ backgroundColor: '#10B981', color: '#000', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: selectedRepo && !loadingStack ? 1 : 0.5 }}
              >
                Next: Cloud & Sizing <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Cloud & Sizing */}
        {currentStep === 2 && (
          <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#fff' }}>Step 2: Select Cloud Provider & Compute Sizing</h2>
            
            {/* Provider Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                onClick={() => setSelectedCloud('aws')}
                style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: selectedCloud === 'aws' ? '2px solid #10B981' : '1px solid #27272a', backgroundColor: selectedCloud === 'aws' ? 'rgba(16, 185, 129, 0.05)' : '#09090b', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 'bold', color: '#fff' }}>Amazon Web Services (AWS)</div>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '4px' }}>ECS Fargate / EC2 Compute Engine</div>
              </div>
              <div
                onClick={() => setSelectedCloud('gcp')}
                style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: selectedCloud === 'gcp' ? '2px solid #10B981' : '1px solid #27272a', backgroundColor: selectedCloud === 'gcp' ? 'rgba(16, 185, 129, 0.05)' : '#09090b', cursor: 'pointer' }}
              >
                <div style={{ fontWeight: 'bold', color: '#fff' }}>Google Cloud Platform (GCP)</div>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '4px' }}>Cloud Run Serverless / GCE</div>
              </div>
            </div>

            {/* Compute Choice Selector (AWS: Fargate vs EC2 | GCP: Cloud Run vs GCE) */}
            <div style={{ backgroundColor: '#09090b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#e4e4e7', display: 'block', marginBottom: '4px' }}>
                {selectedCloud.toUpperCase()} Compute Choice
              </label>
              <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginBottom: '1rem' }}>
                {selectedCloud === 'aws'
                  ? 'Choose serverless container orchestration (Fargate) or dedicated Virtual Machines (EC2).'
                  : 'Choose serverless containers (Cloud Run) or dedicated Virtual Machines (Compute Engine).'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {selectedCloud === 'aws' ? (
                  [
                    { id: 'fargate', name: 'ECS Fargate (Serverless)', desc: 'Deploy serverless container stacks with auto-scaling.' },
                    { id: 'ec2', name: 'EC2 Instance (VM - Free Tier)', desc: 'Deploy on dedicated t3.micro virtual server instance (Appears in EC2 Console).' }
                  ].map((choice) => (
                    <div
                      key={choice.id}
                      onClick={() => setAwsComputeChoice(choice.id)}
                      style={{
                        backgroundColor: awsComputeChoice === choice.id ? 'rgba(16, 185, 129, 0.1)' : '#18181b',
                        border: awsComputeChoice === choice.id ? '2px solid #10B981' : '1px solid #3f3f46',
                        borderRadius: '8px', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ color: awsComputeChoice === choice.id ? '#10B981' : '#fff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                        {choice.name}
                      </div>
                      <div style={{ color: '#a1a1aa', fontSize: '0.75rem', lineHeight: '1.3' }}>
                        {choice.desc}
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { id: 'cloudrun', name: 'Cloud Run (Serverless)', desc: 'Run serverless containers with scale-to-zero capability.' },
                    { id: 'gce', name: 'Compute Engine (GCE VM)', desc: 'Run containers on GCE e2-micro virtual machine host.' }
                  ].map((choice) => (
                    <div
                      key={choice.id}
                      onClick={() => setGcpComputeChoice(choice.id)}
                      style={{
                        backgroundColor: gcpComputeChoice === choice.id ? 'rgba(16, 185, 129, 0.1)' : '#18181b',
                        border: gcpComputeChoice === choice.id ? '2px solid #10B981' : '1px solid #3f3f46',
                        borderRadius: '8px', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ color: gcpComputeChoice === choice.id ? '#10B981' : '#fff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                        {choice.name}
                      </div>
                      <div style={{ color: '#a1a1aa', fontSize: '0.75rem', lineHeight: '1.3' }}>
                        {choice.desc}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cloud Credentials Profile Selector */}
            <div style={{ backgroundColor: '#09090b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#10B981" /> Select {selectedCloud.toUpperCase()} Credential Profile
                </label>
                <button
                  onClick={() => navigate('/settings')}
                  style={{ backgroundColor: 'transparent', color: '#10B981', border: 'none', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                >
                  + Add New Credentials
                </button>
              </div>

              <select
                value={selectedCloudCred}
                onChange={(e) => setSelectedCloudCred(e.target.value)}
                style={{ width: '100%', backgroundColor: '#18181b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="">-- Select {selectedCloud.toUpperCase()} Profile --</option>
                {savedCredentials
                  .filter((c) => c.provider === selectedCloud.toLowerCase())
                  .map((c) => (
                    <option key={c.credential_id} value={c.credential_id}>
                      {c.name}
                    </option>
                  ))}
              </select>

              {savedCredentials.filter((c) => c.provider === selectedCloud.toLowerCase()).length === 0 && (
                <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '8px' }}>
                  ⚠️ No saved credentials found for {selectedCloud.toUpperCase()}. Click "+ Add New Credentials" or configure one in Settings before deployment.
                </div>
              )}
            </div>

            {/* Per-Component Instance Sizing */}
            <h3 style={{ fontSize: '1rem', color: '#e4e4e7', marginBottom: '1rem' }}>Per-Component Resource Sizing</h3>
            {componentsConfig.map((comp, idx) => (
              <div key={idx} style={{ backgroundColor: '#09090b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#10B981', fontSize: '0.95rem' }}>📁 {comp.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#71717a' }}>{comp.type} • {comp.path}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Instance Size:</label>
                  <select
                    value={comp.instance_type}
                    onChange={(e) => handleComponentOptionChange(idx, 'instance_type', e.target.value)}
                    style={{ backgroundColor: '#18181b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '6px', padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    {selectedCloud === 'aws' ? (
                      <>
                        <option value="t3.micro">t3.micro (0.25 vCPU / 0.5 GB)</option>
                        <option value="t3.small">t3.small (0.5 vCPU / 1 GB)</option>
                        <option value="t3.medium">t3.medium (1.0 vCPU / 2 GB)</option>
                      </>
                    ) : (
                      <>
                        <option value="e2-micro">e2-micro (1 vCPU / 512MB)</option>
                        <option value="e2-small">e2-small (1 vCPU / 1GB)</option>
                        <option value="e2-medium">e2-medium (2 vCPU / 2GB)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button onClick={() => setCurrentStep(1)} style={{ backgroundColor: '#27272a', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Back</button>
              <button onClick={() => setCurrentStep(3)} style={{ backgroundColor: '#10B981', color: '#000', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Next: Docker Setup <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Docker Prompt & Infrastructure Prep */}
        {currentStep === 3 && (
          <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 1.5rem 0', color: '#fff' }}>Step 3: Dockerfile & Container Options</h2>
            
            {componentsConfig.map((comp, idx) => (
              <div key={idx} style={{ backgroundColor: '#09090b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: '600', color: '#fff', fontSize: '1rem', marginBottom: '6px' }}>
                  Component: <span style={{ color: '#10B981' }}>{comp.name}</span>
                </div>

                {comp.has_dockerfile ? (
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '8px', padding: '1rem', marginTop: '10px' }}>
                    <div style={{ color: '#93c5fd', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileCode size={16} /> Existing Dockerfile detected in component path `{comp.path}`
                    </div>
                    <p style={{ color: '#bfdbfe', fontSize: '0.85rem', margin: '0 0 12px 0' }}>
                      Would you like to reuse your existing Dockerfile, or let Code2Cloud generate a new optimized Dockerfile?
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`df_choice_${idx}`}
                          value="reuse"
                          checked={comp.user_dockerfile_choice === 'reuse'}
                          onChange={() => handleComponentOptionChange(idx, 'user_dockerfile_choice', 'reuse')}
                        />
                        Reuse existing Dockerfile (Recommended)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`df_choice_${idx}`}
                          value="generate"
                          checked={comp.user_dockerfile_choice === 'generate'}
                          onChange={() => handleComponentOptionChange(idx, 'user_dockerfile_choice', 'generate')}
                        />
                        Generate new Dockerfile
                      </label>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginTop: '6px' }}>
                    No Dockerfile detected. Code2Cloud will generate an optimized Dockerfile for this tech stack.
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button onClick={() => setCurrentStep(2)} style={{ backgroundColor: '#27272a', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Back</button>
              <button
                disabled={generating}
                onClick={handleGenerateConfig}
                style={{ backgroundColor: '#10B981', color: '#000', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {generating ? 'Generating Configurations...' : 'Generate & Proceed to Env Variables'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Environment Variables & Secrets */}
        {currentStep === 4 && (
          <div>
            <EnvVariablesEditor
              owner={owner}
              repo={repoName}
              components={componentsConfig}
              onSecretsSaved={() => {}}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button onClick={() => setCurrentStep(3)} style={{ backgroundColor: '#27272a', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Back</button>
              <button onClick={() => setCurrentStep(5)} style={{ backgroundColor: '#10B981', color: '#000', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Next: Review Pipeline <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review Pipeline & Target Branch */}
        {currentStep === 5 && (
          <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#fff' }}>Step 5: Review & Commit Deployment Pipeline</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Target Branch</label>
              <input
                type="text"
                value={commitBranch}
                onChange={(e) => setCommitBranch(e.target.value)}
                style={{ width: '100%', backgroundColor: '#09090b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Commit Message</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                style={{ width: '100%', backgroundColor: '#09090b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px' }}
              />
            </div>

            {generationResult && (
              <div style={{ backgroundColor: '#09090b', padding: '1rem', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '1.5rem' }}>
                <div style={{ color: '#10B981', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px' }}>Files to be committed:</div>
                {Object.keys(generationResult.generated_code || {}).map(f => (
                  <div key={f} style={{ color: '#a1a1aa', fontSize: '0.85rem', fontFamily: 'monospace' }}>📄 {f}</div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrentStep(4)} style={{ backgroundColor: '#27272a', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' }}>Back</button>
              <button
                disabled={committing}
                onClick={handleCommitAndDeploy}
                style={{ backgroundColor: '#10B981', color: '#000', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Play size={16} /> {committing ? 'Committing & Deploying...' : 'Commit & Direct Deploy to Cloud'}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Live Deployment Status */}
        {currentStep === 6 && (
          <div style={{ backgroundColor: '#18181b', padding: '2rem', borderRadius: '12px', border: '1px solid #27272a', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#10B981', margin: '0 0 1rem 0' }}>🚀 Deployment Pipeline Launched!</h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Direct deployment files committed to branch <span style={{ color: '#fff', fontWeight: 'bold' }}>{commitBranch}</span>.
            </p>

            {workflowRun ? (
              <div style={{ backgroundColor: '#09090b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #27272a', maxWidth: '500px', margin: '0 auto 2rem auto', textAlign: 'left' }}>
                <div style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Workflow Name: <span style={{ color: '#fff' }}>{workflowRun.name}</span></div>
                <div style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Status: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{workflowRun.status}</span></div>
                <div style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '1rem' }}>Conclusion: <span style={{ color: workflowRun.conclusion === 'success' ? '#10B981' : '#f59e0b' }}>{workflowRun.conclusion || 'Running...'}</span></div>
                <a
                  href={workflowRun.html_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#10B981', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                  View Live GitHub Action Logs ↗
                </a>
              </div>
            ) : (
              <Preloader message="Polling GitHub Actions workflow status..." />
            )}

            <button onClick={() => navigate('/history')} style={{ backgroundColor: '#27272a', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer' }}>
              Go to History & Deployments
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
