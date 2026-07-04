import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileCode, Folder, Download, Save, ArrowLeft, Check, AlertCircle, RefreshCw, Layers, GitCommit, GitBranch, Database, ShieldCheck, Play, Lock, ExternalLink, CloudLightning } from 'lucide-react';
import { apiClient } from '../utils/api';

function GenerationViewer() {
  const { generationId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [url, setUrl] = useState('');
  
  // Hot code map: { "Dockerfile": "...", "docker-compose.yml": "..." }
  const [codeMap, setCodeMap] = useState({});
  const [selectedFile, setSelectedFile] = useState('');
  const [activeTabs, setActiveTabs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Track changes locally to show "unsaved" status per file
  const [initialCodeMap, setInitialCodeMap] = useState({});

  // Generation details
  const [repoUrl, setRepoUrl] = useState('');
  const [cloud, setCloud] = useState('');
  const [serviceId, setServiceId] = useState('');

  // GHA Secrets & Saved Credentials state
  const [savedCredentials, setSavedCredentials] = useState([]);
  const [selectedCloudCred, setSelectedCloudCred] = useState('');
  const [selectedDockerCred, setSelectedDockerCred] = useState('');
  const [registryType, setRegistryType] = useState('native');
  
  // AWS target compute config states
  const [awsComputeChoice, setAwsComputeChoice] = useState('fargate');
  const [awsInstanceType, setAwsInstanceType] = useState('t3.micro');
  const [awsUseEip, setAwsUseEip] = useState(false);
  
  // GCP target compute config states
  const [gcpComputeChoice, setGcpComputeChoice] = useState('cloudrun');
  const [gcpMachineType, setGcpMachineType] = useState('e2-micro');
  const [gcpUseStaticIp, setGcpUseStaticIp] = useState(false);

  const [pushingSecrets, setPushingSecrets] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [pushError, setPushError] = useState('');

  // Workflow Run Monitoring state
  const [latestRun, setLatestRun] = useState(null);
  const [polling, setPolling] = useState(false);

  // Direct SCM commit states
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [commitBranch, setCommitBranch] = useState('code2cloud-setup');
  const [commitMessage, setCommitMessage] = useState('ci: add generated deployment configurations via Code2Cloud');
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const [commitError, setCommitError] = useState('');

  const getOwnerAndRepo = () => {
    if (!repoUrl) return { owner: '', repo: '' };
    const cleanUrl = repoUrl.replace("https://github.com/", "").replace("http://github.com/", "");
    const parts = cleanUrl.split("/").filter(p => p);
    return {
      owner: parts[0] || '',
      repo: parts[1] || ''
    };
  };

  const handleCommit = async (e) => {
    e.preventDefault();
    try {
      setCommitting(true);
      setCommitError('');
      setCommitResult(null);
      
      const res = await apiClient.post(`/repos/generations/${generationId}/commit`, {
        branch: commitBranch,
        commit_message: commitMessage
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to publish commit to GitHub.');
      }
      
      const data = await res.json();
      setCommitResult(data);
      // Start polling GHA workflow status immediately after successful commit
      setPolling(true);
      setTimeout(() => {
        fetchWorkflowStatus();
      }, 2000);
    } catch (err) {
      setCommitError(err.message || 'An unexpected error occurred while committing.');
    } finally {
      setCommitting(false);
    }
  };

  const fetchWorkflowStatus = async () => {
    const { owner, repo } = getOwnerAndRepo();
    if (!owner || !repo) return;
    try {
      const res = await apiClient.get(`/repos/${owner}/${repo}/actions/runs?branch=${commitBranch}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.latest_run) {
          setLatestRun(data.latest_run);
          if (data.latest_run.status === 'queued' || data.latest_run.status === 'in_progress') {
            setPolling(true);
          } else {
            setPolling(false);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch workflow runs", err);
    }
  };

  const handlePushSecrets = async () => {
    const { owner, repo } = getOwnerAndRepo();
    if (!owner || !repo) return;

    setPushingSecrets(true);
    setPushError('');
    setPushSuccess(false);

    const credentialIds = [];
    if (selectedCloudCred) credentialIds.push(selectedCloudCred);
    if (registryType === 'dockerhub' && selectedDockerCred) credentialIds.push(selectedDockerCred);

    if (credentialIds.length === 0) {
      setPushError("Please select at least one credential profile to push.");
      setPushingSecrets(false);
      return;
    }

    try {
      const res = await apiClient.post(`/repos/${owner}/${repo}/secrets/push-saved`, {
        credential_ids: credentialIds
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to configure secrets.");
      }

      setPushSuccess(true);
    } catch (err) {
      setPushError(err.message || "An error occurred while pushing secrets.");
    } finally {
      setPushingSecrets(false);
    }
  };

  const handleRegenerate = async (regType) => {
    const { owner, repo } = getOwnerAndRepo();
    if (!owner || !repo) return;

    try {
      setSaving(true);
      const res = await apiClient.post(`/repos/${owner}/${repo}/generate`, {
        serviceId,
        cloud,
        techStack: null,
        registryType: regType,
        awsComputeChoice,
        awsInstanceType,
        awsUseEip,
        gcpComputeChoice,
        gcpMachineType,
        gcpUseStaticIp
      });
      if (res.ok) {
        const data = await res.json();
        setCodeMap(data.generated_code || {});
        setInitialCodeMap(JSON.parse(JSON.stringify(data.generated_code || {})));
        const files = Object.keys(data.generated_code || {});
        if (files.length > 0) {
          setSelectedFile(files[0]);
        }
      }
    } catch (err) {
      console.error("Failed to regenerate configurations", err);
    } finally {
      setSaving(false);
    }
  };

  // Poll workflow status when polling state changes
  useEffect(() => {
    let intervalId;
    if (polling) {
      intervalId = setInterval(() => {
        fetchWorkflowStatus();
      }, 7000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [polling, repoUrl, commitBranch]);

  useEffect(() => {
    const fetchGeneration = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/repos/generations/${generationId}`);
        if (!res.ok) {
          throw new Error('Failed to load generation data.');
        }
        const data = await res.json();
        setCodeMap(data.generated_code || {});
        setInitialCodeMap(JSON.parse(JSON.stringify(data.generated_code || {})));
        setProjectName(data.project_name || 'Project');
        setUrl(data.url || '');
        setRepoUrl(data.repo_url || '');
        setCloud(data.cloud || '');
        setServiceId(data.service_id || '');
        setRegistryType(data.registry_type || 'native');
        setAwsComputeChoice(data.aws_compute_choice || 'fargate');
        setAwsInstanceType(data.aws_instance_type || 't3.micro');
        setAwsUseEip(data.aws_use_eip || false);
        setGcpComputeChoice(data.gcp_compute_choice || 'cloudrun');
        setGcpMachineType(data.gcp_machine_type || 'e2-micro');
        setGcpUseStaticIp(data.gcp_use_static_ip || false);

        if (data.committed) {
          setPolling(true);
        }
        
        // Pick first file as active by default
        const files = Object.keys(data.generated_code || {});
        if (files.length > 0) {
          setSelectedFile(files[0]);
          setActiveTabs([files[0]]);
        }

        // Load user's saved credentials
        try {
          const credRes = await apiClient.get('/credentials/');
          if (credRes.ok) {
            const credData = await credRes.json();
            setSavedCredentials(credData);
            
            // Auto-select first matching credential if available
            const cloudProv = (data.cloud || '').toLowerCase();
            const matchingCloud = credData.find(c => c.provider === cloudProv);
            if (matchingCloud) setSelectedCloudCred(matchingCloud.credential_id);

            const matchingDocker = credData.find(c => c.provider === 'dockerhub');
            if (matchingDocker) setSelectedDockerCred(matchingDocker.credential_id);
          }
        } catch (cErr) {
          console.error("Error loading saved credentials", cErr);
        }

      } catch (err) {
        setError(err.message || 'Failed to fetch generated configurations.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGeneration();
  }, [generationId]);

  // Sync scroll of textarea and line numbers
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCodeChange = (e) => {
    const updatedVal = e.target.value;
    setCodeMap((prev) => ({
      ...prev,
      [selectedFile]: updatedVal,
    }));
  };

  const selectFile = (file) => {
    setSelectedFile(file);
    if (!activeTabs.includes(file)) {
      setActiveTabs((prev) => [...prev, file]);
    }
  };

  const closeTab = (e, file) => {
    e.stopPropagation();
    const updatedTabs = activeTabs.filter((t) => t !== file);
    setActiveTabs(updatedTabs);
    
    if (selectedFile === file && updatedTabs.length > 0) {
      setSelectedFile(updatedTabs[updatedTabs.length - 1]);
    } else if (updatedTabs.length === 0) {
      setSelectedFile('');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      
      const res = await apiClient.put(`/repos/generations/${generationId}/update`, {
        generated_code: codeMap
      });
      
      if (!res.ok) {
        throw new Error('Failed to update files.');
      }
      
      // Update baseline to clear "unsaved" styling
      setInitialCodeMap(JSON.parse(JSON.stringify(codeMap)));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Error saving changes.');
    } finally {
      setSaving(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await apiClient.get(`/repos/generations/${generationId}/download`);
      if (!res.ok) {
        throw new Error('Could not fetch the ZIP package from server.');
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${projectName}-${generationId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert(err.message || 'Error downloading ZIP.');
    } finally {
      setDownloading(false);
    }
  };

  // Construct line numbers array
  const currentCode = codeMap[selectedFile] || '';
  const lineCount = currentCode.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  // Group files into subfolders for a premium look
  const getFileGroups = () => {
    const groups = { root: [] };
    Object.keys(codeMap).forEach((path) => {
      if (path.includes('/')) {
        const lastSlashIndex = path.lastIndexOf('/');
        const folder = path.substring(0, lastSlashIndex);
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(path);
      } else {
        groups.root.push(path);
      }
    });
    return groups;
  };

  // Shorten long file paths for editor tabs to keep them readable and clean
  const getShortTabName = (path) => {
    const parts = path.split('/');
    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    }
    return path;
  };

  const fileGroups = getFileGroups();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div className="loading-spinner" style={{ width: '48px', height: '48px' }}></div>
        <p style={{ color: '#a2a2b5', fontSize: '1.1rem' }}>Streaming your Hot Tier configurations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', background: 'rgba(255, 107, 107, 0.05)', border: '2px solid rgba(255, 107, 107, 0.3)', borderRadius: '24px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '1rem' }} />
        <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Configuration Error</h3>
        <p style={{ color: '#a2a2b5', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => navigate('/services')} style={{ background: 'var(--c2c-green)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--c2c-green-hover)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--c2c-green)'}>
          Return to Setup
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/services')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '2px solid var(--c2c-border)', color: '#a2a2b5', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', margin: 0 }}>
              {projectName} 
            </h2>
            <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: 0 }}>Generation ID: {generationId}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <span style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.8rem', 
            background: 'rgba(16,185,129,0.1)', 
            color: '#10B981', 
            padding: '0 1rem', 
            borderRadius: '12px', 
            border: '2px solid rgba(16,185,129,0.3)',
            fontWeight: '600',
            height: '38px',
            boxSizing: 'border-box',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}>
            Hot/Cold Synced
          </span>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: saveSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: saveSuccess ? '2px solid #10B981' : '2px solid var(--c2c-border)',
              color: saveSuccess ? '#10B981' : '#fff',
              padding: '0 1.2rem',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              height: '38px',
              boxSizing: 'border-box',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease'
            }}
          >
            {saving ? (
              <RefreshCw size={16} className="loading-spinner" />
            ) : saveSuccess ? (
              <Check size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Saving...' : saveSuccess ? 'Changes Saved!' : 'Save Hot Tier'}
          </button>

          <button
            onClick={() => setCommitModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--c2c-selected-bg)',
              border: '2px solid var(--c2c-green)',
              color: 'var(--c2c-green)',
              padding: '0 1.2rem',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              height: '38px',
              boxSizing: 'border-box',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
              e.currentTarget.style.borderColor = 'var(--c2c-green)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--c2c-selected-bg)';
              e.currentTarget.style.borderColor = 'var(--c2c-green)';
            }}
          >
            <GitCommit size={16} />
            Commit to GitHub
          </button>

          {url && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, var(--c2c-green), var(--c2c-green-hover))',
                border: '2px solid transparent',
                color: '#05050a',
                padding: '0 1.2rem',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: downloading ? 'not-allowed' : 'pointer',
                height: '38px',
                boxSizing: 'border-box',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)',
                transition: 'transform 0.2s',
                opacity: downloading ? 0.7 : 1
              }}
              onMouseOver={(e) => !downloading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !downloading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {downloading ? (
                <RefreshCw size={16} className="loading-spinner" />
              ) : (
                <Download size={16} />
              )}
              {downloading ? 'Downloading...' : 'Download ZIP (.zip)'}
            </button>
          )}
        </div>

      </div>

      {/* Editor Body Workspace */}
      <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, background: 'var(--c2c-surface)', border: '2px solid var(--c2c-border)', borderRadius: '24px', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
        
        {/* Left Sidebar File Explorer */}
        <div style={{ width: '260px', flexShrink: 0, borderRight: '2px solid var(--c2c-border)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--c2c-nav-bg)', overflowY: 'auto' }}>
          <div>
            <span style={{ color: '#6e7191', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>WORKSPACE FILES</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              {/* Nested Folders */}
              {Object.keys(fileGroups).map((folder) => {
                if (folder === 'root') return null;
                return (
                  <div key={folder}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a2a2b5', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', paddingLeft: '0.2rem' }}>
                      <Folder size={14} style={{ color: 'var(--c2c-green)' }} />
                      {folder}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                      {fileGroups[folder].map((path) => {
                        const isSelected = selectedFile === path;
                        const isModified = codeMap[path] !== initialCodeMap[path];
                        return (
                          <div
                            key={path}
                            onClick={() => selectFile(path)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.5rem 0.6rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: isSelected ? 'var(--c2c-selected-bg)' : 'transparent',
                              color: isSelected ? '#fff' : '#a2a2b5',
                              fontSize: '0.85rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                              <FileCode size={14} style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {path.split('/').pop()}
                              </span>
                            </div>
                            {isModified && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c2c-green)' }}></span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Root Files */}
              {fileGroups.root && fileGroups.root.map((path) => {
                const isSelected = selectedFile === path;
                const isModified = codeMap[path] !== initialCodeMap[path];
                return (
                  <div
                    key={path}
                    onClick={() => selectFile(path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.6rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--c2c-selected-bg)' : 'transparent',
                      color: isSelected ? '#fff' : '#a2a2b5',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                      <FileCode size={14} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {path}
                      </span>
                    </div>
                    {isModified && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c2c-green)' }}></span>}
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* Editor Screen & Tabs */}
        <div style={{ flexGrow: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--c2c-bg)' }}>
          
          {/* Tab Bar */}
          <div style={{ display: 'flex', background: 'var(--c2c-nav-bg)', borderBottom: '2px solid var(--c2c-border)', overflowX: 'auto', position: 'sticky', top: 0, zIndex: 10 }}>
            {activeTabs.map((tab) => {
              const isActive = selectedFile === tab;
              const isModified = codeMap[tab] !== initialCodeMap[tab];
              return (
                <div
                  key={tab}
                  onClick={() => setSelectedFile(tab)}
                  title={tab}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem 1.2rem',
                    borderRight: '2px solid var(--c2c-border)',
                    background: isActive ? 'var(--c2c-bg)' : 'var(--c2c-surface)',
                    color: isActive ? '#fff' : '#6e7191',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {isModified && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--c2c-green)' }}></span>}
                  <span>{getShortTabName(tab)}</span>
                  <span
                    onClick={(e) => closeTab(e, tab)}
                    style={{ fontSize: '0.75rem', color: '#6e7191', padding: '0.1rem 0.25rem', borderRadius: '4px', display: 'inline-block' }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#6e7191'}
                  >
                    ×
                  </span>
                </div>
              );
            })}
          </div>

          {/* Main Text Editor Workspace */}
          {selectedFile ? (
            <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
              
              {/* Line Numbers column */}
              <div
                ref={lineNumbersRef}
                style={{
                  width: '45px',
                  padding: '1.2rem 0',
                  background: '#040407',
                  borderRight: '2px solid var(--c2c-border)',
                  color: 'rgba(255,255,255,0.2)',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.5rem',
                  textAlign: 'right',
                  paddingRight: '10px',
                  userSelect: 'none',
                  overflow: 'hidden'
                }}
              >
                {lineNumbers.map((num) => (
                  <div key={num}>{num}</div>
                ))}
              </div>

              {/* Textarea Editor */}
              <textarea
                ref={textareaRef}
                value={codeMap[selectedFile] || ''}
                onChange={handleCodeChange}
                onScroll={handleScroll}
                spellCheck="false"
                style={{
                  flexGrow: 1,
                  padding: '1.2rem 1.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#e2e2e9',
                  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.5rem',
                  resize: 'none',
                  outline: 'none',
                  whiteSpace: 'pre',
                  overflow: 'auto'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: '#6e7191', gap: '0.5rem' }}>
              <Layers size={36} />
              <span>Select a file from the explorer to preview or edit</span>
            </div>
          )}
        </div>

        {/* Right Sidebar Deployment & Secrets Panel */}
        {serviceId === 'terraform' && (cloud.toLowerCase() === 'aws' || cloud.toLowerCase() === 'gcp') && (
          <div style={{
            width: '340px',
            flexShrink: 0,
            borderLeft: '2px solid var(--c2c-border)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            background: 'var(--c2c-nav-bg)',
            overflowY: 'auto'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CloudLightning size={16} style={{ color: 'var(--c2c-green)' }} />
                GHA Deployment
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', color: '#a2a2b5', fontSize: '0.75rem', lineHeight: '1.3' }}>
                Automatically containerize and deploy this service into the cloud.
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid var(--c2c-border)', margin: 0 }} />

            {/* Registry Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#a2a2b5' }}>CONTAINER REGISTRY</label>
              <select
                value={registryType}
                onChange={(e) => {
                  const val = e.target.value;
                  setRegistryType(val);
                  handleRegenerate(val);
                }}
                style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.6rem', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
              >
                <option value="native" style={{ background: '#0f0f15', color: '#fff' }}>
                  {cloud.toLowerCase() === 'aws' ? 'Amazon ECR (Native)' : 'Google Artifact Registry (GAR)'}
                </option>
                <option value="dockerhub" style={{ background: '#0f0f15', color: '#fff' }}>Docker Hub</option>
              </select>
            </div>

            {/* Secrets Config Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '16px', border: '2px solid var(--c2c-border)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={12} style={{ color: 'var(--c2c-green)' }} />
                Link Secret Profiles
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#a2a2b5' }}>{cloud.toUpperCase()} PROFILE</label>
                <select
                  value={selectedCloudCred}
                  onChange={(e) => setSelectedCloudCred(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.5rem', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="" style={{ background: '#0f0f15', color: '#fff' }}>-- Select Credentials --</option>
                  {savedCredentials
                    .filter((c) => c.provider === cloud.toLowerCase())
                    .map((c) => (
                      <option key={c.credential_id} value={c.credential_id} style={{ background: '#0f0f15', color: '#fff' }}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {registryType === 'dockerhub' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#a2a2b5' }}>DOCKER HUB PROFILE</label>
                  <select
                    value={selectedDockerCred}
                    onChange={(e) => setSelectedDockerCred(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '2px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.5rem', fontSize: '0.75rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="" style={{ background: '#0f0f15', color: '#fff' }}>-- Select Credentials --</option>
                    {savedCredentials
                      .filter((c) => c.provider === 'dockerhub')
                      .map((c) => (
                        <option key={c.credential_id} value={c.credential_id} style={{ background: '#0f0f15', color: '#fff' }}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {savedCredentials.filter(c => c.provider === cloud.toLowerCase()).length === 0 && (
                <span style={{ fontSize: '0.7rem', color: '#6e7191', marginTop: '0.2rem' }}>
                  💡 No credential profiles found. Create them in the <a href="/settings" style={{ color: 'var(--c2c-green)', textDecoration: 'underline' }}>Settings Page</a> first.
                </span>
              )}

              {pushError && (
                <span style={{ fontSize: '0.7rem', color: '#ff6b6b' }}>⚠️ {pushError}</span>
              )}

              {pushSuccess && (
                <span style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Check size={12} /> Secrets updated on GitHub!
                </span>
              )}

              <button
                onClick={handlePushSecrets}
                disabled={pushingSecrets}
                style={{
                  background: pushingSecrets ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--c2c-green), var(--c2c-green-hover))',
                  border: 'none',
                  color: pushingSecrets ? '#a2a2b5' : '#05050a',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.75rem',
                  cursor: pushingSecrets ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '0.3rem'
                }}
              >
                {pushingSecrets ? 'Pushing Secrets...' : 'Push Secrets to GHA'}
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid var(--c2c-border)', margin: 0 }} />

            {/* Pipeline Tracker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a2a2b5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Deployment Pipeline
              </span>

              {polling || latestRun ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.01)', border: '2px solid var(--c2c-border)', padding: '1rem', borderRadius: '16px' }}>
                  
                  {/* Status Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: latestRun?.status === 'completed' 
                          ? (latestRun?.conclusion === 'success' ? '#10B981' : '#ff6b6b') 
                          : 'var(--c2c-green)',
                        animation: latestRun?.status !== 'completed' ? 'pulse 1.5s infinite' : 'none'
                      }}></span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff', textTransform: 'capitalize' }}>
                        {latestRun ? `${latestRun.status} (${latestRun.conclusion || 'running'})` : 'Triggering GHA...'}
                      </span>
                    </div>
                    
                    {latestRun?.html_url && (
                      <a 
                        href={latestRun.html_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: 'var(--c2c-green)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
                      >
                        Logs <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  {/* Progress Steps Visualizer */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(255,255,255,0.05)', marginLeft: '0.25rem' }}>
                    
                    {/* Step 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative' }}>
                      <span style={{ 
                        position: 'absolute', 
                        left: '-13px', 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: '#10B981'
                      }}></span>
                      <span style={{ fontSize: '0.75rem', color: '#fff' }}>Commit configurations (Committed ✅)</span>
                    </div>

                    {/* Step 2 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative' }}>
                      <span style={{ 
                        position: 'absolute', 
                        left: '-13px', 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: latestRun?.status === 'completed' 
                          ? '#10B981' 
                          : (latestRun?.status === 'in_progress' ? 'var(--c2c-green)' : '#6e7191')
                      }}></span>
                      <span style={{ fontSize: '0.75rem', color: latestRun?.status === 'in_progress' ? 'var(--c2c-green)' : 'var(--c2c-text-secondary)' }}>
                        Build & Push Container ({latestRun?.status === 'completed' ? 'Success' : latestRun?.status === 'in_progress' ? 'Running' : 'Pending'})
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative' }}>
                      <span style={{ 
                        position: 'absolute', 
                        left: '-13px', 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: latestRun?.status === 'completed' && latestRun?.conclusion === 'success'
                          ? '#10B981' 
                          : (latestRun?.status === 'completed' && latestRun?.conclusion !== 'success' ? '#ff6b6b' : '#6e7191')
                      }}></span>
                      <span style={{ fontSize: '0.75rem', color: latestRun?.status === 'completed' ? '#fff' : '#a2a2b5' }}>
                        Terraform Infrastructure Apply ({latestRun?.status === 'completed' ? (latestRun?.conclusion === 'success' ? 'Success' : 'Failed') : 'Pending'})
                      </span>
                    </div>

                  </div>

                </div>
              ) : (
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '2px dashed var(--c2c-border)', borderRadius: '16px', textAlign: 'center', color: '#6e7191', fontSize: '0.8rem' }}>
                  Pipeline will start automatically once you commit configurations to GitHub.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Premium Glassmorphic Commit Modal */}
      {commitModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 10, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '2px solid var(--c2c-border)',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            padding: '2.5rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            
            {/* Modal Title */}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <GitBranch style={{ color: 'var(--c2c-green)' }} />
                Commit to GitHub
              </h3>
              <p style={{ margin: '0.4rem 0 0 0', color: '#a2a2b5', fontSize: '0.85rem' }}>
                Overlaying your configurations directly onto your repository.
              </p>
            </div>

            {commitResult ? (
              // Success View
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.2rem', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={28} style={{ color: '#10B981' }} />
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '600', margin: 0 }}>Commit Published Successfully!</h4>
                  <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    Your generated files have been committed to the <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.4rem', borderRadius: '4px', color: 'var(--c2c-green)' }}>{commitResult.branch}</code> branch.
                  </p>
                </div>
                
                <div style={{ display: 'flex', width: '100%', gap: '1rem', marginTop: '0.5rem' }}>
                  <a
                    href={commitResult.commit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, var(--c2c-green), var(--c2c-green-hover))',
                      color: '#05050a',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    View Commit on GitHub
                  </a>
                  <button
                    onClick={() => {
                      setCommitModalOpen(false);
                      setCommitResult(null);
                    }}
                    style={{
                      flex: 0.5,
                      background: 'rgba(255,255,255,0.05)',
                      border: '2px solid var(--c2c-border)',
                      color: '#fff',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              // Form View
              <form onSubmit={handleCommit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {commitError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    background: 'rgba(255, 107, 107, 0.08)',
                    border: '2px solid rgba(255, 107, 107, 0.3)',
                    color: '#ff8585',
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <span>{commitError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>TARGET BRANCH</label>
                  <input
                    type="text"
                    value={commitBranch}
                    onChange={(e) => setCommitBranch(e.target.value)}
                    placeholder="e.g. code2cloud-setup"
                    required
                    style={{
                    background: 'var(--c2c-surface)',
                    border: '2px solid var(--c2c-border)',
                    color: '#fff',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--c2c-green)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--c2c-border)'}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--c2c-text-muted)' }}>
                  If the branch does not exist, it will be automatically created off your default branch.
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>COMMIT MESSAGE</label>
                  <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Describe your configurations..."
                    required
                    rows={3}
                    style={{
                    background: 'var(--c2c-surface)',
                    border: '2px solid var(--c2c-border)',
                    color: '#fff',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'sans-serif',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--c2c-green)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--c2c-border)'}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    disabled={committing}
                    onClick={() => {
                      setCommitModalOpen(false);
                      setCommitError('');
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '2px solid var(--c2c-border)',
                      color: '#a2a2b5',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      cursor: committing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={committing}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, var(--c2c-green), var(--c2c-green-hover))',
                      border: 'none',
                      color: '#05050a',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      fontWeight: '700',
                      cursor: committing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    {committing ? (
                      <>
                        <RefreshCw size={16} className="loading-spinner" />
                        Committing...
                      </>
                    ) : (
                      <>
                        <GitCommit size={16} />
                        Publish Commit
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerationViewer;
