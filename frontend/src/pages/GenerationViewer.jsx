import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileCode, Folder, Download, Save, ArrowLeft, Check, AlertCircle, RefreshCw, Layers, GitCommit, GitBranch, GitMerge, Database, ShieldCheck, Play, Lock, ExternalLink, CloudLightning, Key, Shield, Globe, Zap, Trash2, Plus, Unlock, Eye, EyeOff, KeyRound, FileText, Copy, Server, CheckCircle2, Terminal, Code2, Cloud } from 'lucide-react';
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
  const [awsComputeChoice, setAwsComputeChoice] = useState('ec2');
  const [awsInstanceType, setAwsInstanceType] = useState('t3.micro');
  const [awsUseEip, setAwsUseEip] = useState(true);
  
  // GCP target compute config states
  const [gcpComputeChoice, setGcpComputeChoice] = useState('cloudrun');
  const [gcpMachineType, setGcpMachineType] = useState('e2-micro');
  const [gcpUseStaticIp, setGcpUseStaticIp] = useState(false);
  const [componentConfigs, setComponentConfigs] = useState({});

  // Advanced Infrastructure states
  const [genRegion, setGenRegion] = useState('');
  const [genEnv, setGenEnv] = useState('production');
  const [genStorage, setGenStorage] = useState(20);
  const [genSwapEnabled, setGenSwapEnabled] = useState(false);
  const [genSwapSizeGb, setGenSwapSizeGb] = useState(2);
  const [genDbEnabled, setGenDbEnabled] = useState(false);
  const [genDbEngine, setGenDbEngine] = useState('postgres');

  const [pushingSecrets, setPushingSecrets] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [pushError, setPushError] = useState('');

  // Workflow Run Monitoring state
  const [latestRun, setLatestRun] = useState(null);
  const [latestDeployRun, setLatestDeployRun] = useState(null);
  const [latestDestroyRun, setLatestDestroyRun] = useState(null);
  const [isTornDown, setIsTornDown] = useState(false);
  const [polling, setPolling] = useState(false);

  // Live Cloud Application Endpoints state
  const [liveEndpoints, setLiveEndpoints] = useState([]);
  const [serverUrl, setServerUrl] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  const handleCopyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const sanitizeIp = (val) => {
    if (!val || typeof val !== 'string') return '';
    const clean = val.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/["']/g, '').trim();
    if (clean.startsWith('$') || clean.includes('echo')) return '';
    return clean;
  };

  const rawServerUrl = serverUrl || liveEndpoints.find(e => e.type === 'frontend')?.url || liveEndpoints.find(e => e.type !== 'database')?.url || (serverIp ? `https://${serverIp.replace(/\./g, '-')}.sslip.io` : '');
  const rawServerIp = serverIp || liveEndpoints.find(e => e.type === 'frontend')?.ip || liveEndpoints.find(e => e.type !== 'database')?.ip || '';

  const computedServerUrl = sanitizeIp(rawServerUrl);
  const computedServerIp = sanitizeIp(rawServerIp);

  const isServerLive = !isTornDown && Boolean(
    (latestDeployRun?.status === 'completed' && latestDeployRun?.conclusion === 'success') ||
    (liveEndpoints && liveEndpoints.length > 0) ||
    computedServerIp ||
    computedServerUrl
  );

  const isDeployRunning = Boolean(
    latestDeployRun && (latestDeployRun.status === 'queued' || latestDeployRun.status === 'in_progress')
  );

  const isCloudDeploy = serviceId === 'terraform' || serviceId === 'cloud_deploy';
  const isTerraformScriptOnly = serviceId === 'terraform_script' || serviceId === 'terraform_only';

  // Direct SCM commit states
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [commitBranch, setCommitBranch] = useState('code2cloud-setup');
  const [commitMessage, setCommitMessage] = useState('ci: add generated deployment configurations via Code2Cloud');
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const [commitError, setCommitError] = useState('');

  // Automated GitHub Actions Cloud Secrets configuration states
  const [pushSecretsToGitHub, setPushSecretsToGitHub] = useState(true);
  const [secretsSource, setSecretsSource] = useState('saved'); // 'saved' | 'manual'
  const [manualAccessKey, setManualAccessKey] = useState('');
  const [manualSecretKey, setManualSecretKey] = useState('');
  const [manualRegion, setManualRegion] = useState('');
  const [manualSessionToken, setManualSessionToken] = useState('');
  const [manualGcpSaKey, setManualGcpSaKey] = useState('');
  const [manualGcpProjectId, setManualGcpProjectId] = useState('');
  const [manualDockerUser, setManualDockerUser] = useState('');
  const [manualDockerPass, setManualDockerPass] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [profileName, setProfileName] = useState('');

  // Teardown Infrastructure (terraform destroy) states
  const [destroyModalOpen, setDestroyModalOpen] = useState(false);
  const [destroyConfirmInput, setDestroyConfirmInput] = useState('');
  const [destroying, setDestroying] = useState(false);
  const [destroyError, setDestroyError] = useState('');
  const [destroySuccess, setDestroySuccess] = useState(false);
  const [destroySuccessMsg, setDestroySuccessMsg] = useState('');
  const [mergeToDefault, setMergeToDefault] = useState(true);

  const isTeardownRunning = Boolean(
    destroying ||
    (destroySuccess && (!latestDestroyRun || latestDestroyRun.status !== 'completed')) ||
    (latestDestroyRun && (latestDestroyRun.status === 'queued' || latestDestroyRun.status === 'in_progress'))
  );

  const isTeardownSuccess = Boolean(
    isTornDown ||
    (!isTeardownRunning && latestDestroyRun?.status === 'completed' && latestDestroyRun?.conclusion === 'success')
  );

  const isTeardownFailed = Boolean(
    !isTeardownRunning &&
    latestDestroyRun?.status === 'completed' &&
    latestDestroyRun?.conclusion !== 'success'
  );

  // Post-Deployment Environment Variables state
  const [envModalOpen, setEnvModalOpen] = useState(false);
  const [postDeployEnvVars, setPostDeployEnvVars] = useState({});
  const [envUpdating, setEnvUpdating] = useState(false);
  const [envUpdatingAction, setEnvUpdatingAction] = useState(''); // 'push_only' | 'cd' | 'deploy'
  const [envUpdateSuccess, setEnvUpdateSuccess] = useState(false);
  const [envPushedSecrets, setEnvPushedSecrets] = useState([]);
  const [envWorkflowTriggered, setEnvWorkflowTriggered] = useState(false);
  const [envUpdateError, setEnvUpdateError] = useState('');
  const [envShowSecretMap, setEnvShowSecretMap] = useState({});
  const [envPasteModalComp, setEnvPasteModalComp] = useState(null);
  const [envPasteText, setEnvPasteText] = useState('');

  const handleAddPostDeployEnvVar = (compName) => {
    setPostDeployEnvVars((prev) => ({
      ...prev,
      [compName]: [...(prev[compName] || []), { key: '', value: '', is_secret: false }]
    }));
  };

  const handleUpdatePostDeployEnvVar = (compName, index, field, value) => {
    setPostDeployEnvVars((prev) => {
      const list = [...(prev[compName] || [])];
      list[index] = { ...list[index], [field]: value };
      if (field === 'key') {
        const upper = value.toUpperCase();
        if (['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'AUTH', 'PRIVATE', 'CREDENTIAL'].some((k) => upper.includes(k))) {
          list[index].is_secret = true;
        }
      }
      return { ...prev, [compName]: list };
    });
  };

  const handleDeletePostDeployEnvVar = (compName, index) => {
    setPostDeployEnvVars((prev) => ({
      ...prev,
      [compName]: (prev[compName] || []).filter((_, i) => i !== index)
    }));
  };

  const handleImportPostDeployEnvPaste = () => {
    if (!envPasteModalComp || !envPasteText) {
      setEnvPasteModalComp(null);
      return;
    }
    const lines = envPasteText.split('\n');
    const secretKeywords = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'AUTH', 'PRIVATE', 'CREDENTIAL'];
    const newItems = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim();
        let v = trimmed.slice(eqIdx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (k) {
          const isSec = secretKeywords.some((kw) => k.toUpperCase().includes(kw));
          newItems.push({ key: k, value: v, is_secret: isSec });
        }
      }
    });

    setPostDeployEnvVars((prev) => {
      const existing = prev[envPasteModalComp] || [];
      const map = new Map(existing.map((item) => [item.key, item]));
      newItems.forEach((item) => map.set(item.key, item));
      return { ...prev, [envPasteModalComp]: Array.from(map.values()) };
    });

    setEnvPasteModalComp(null);
    setEnvPasteText('');
  };

  const handleSavePostDeployEnvVars = async (redeploy = true, targetWorkflow = 'cd.yml') => {
    try {
      setEnvUpdating(true);
      setEnvUpdatingAction(redeploy ? (targetWorkflow === 'cd.yml' ? 'cd' : 'deploy') : 'push_only');
      setEnvUpdateError('');
      setEnvUpdateSuccess(false);
      setEnvPushedSecrets([]);
      setEnvWorkflowTriggered(false);

      const res = await apiClient.post(`/repos/generations/${generationId}/env-vars`, {
        env_vars: postDeployEnvVars,
        redeploy: redeploy,
        branch: commitBranch || 'code2cloud-setup',
        target_workflow: targetWorkflow
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update environment variables');
      }

      const data = await res.json();
      setEnvUpdateSuccess(true);
      setEnvPushedSecrets(data.secrets_pushed || []);
      setEnvWorkflowTriggered(Boolean(data.workflow_triggered));

      if (data.workflow_triggered) {
        setPolling(true);
        setTimeout(() => {
          fetchWorkflowStatus();
        }, 2000);
      }
      setTimeout(() => {
        setEnvUpdateSuccess(false);
      }, 7000);
    } catch (err) {
      setEnvUpdateError(err.message || 'Error updating environment variables');
    } finally {
      setEnvUpdating(false);
      setEnvUpdatingAction('');
    }
  };


  const getOwnerAndRepo = () => {
    if (!repoUrl) return { owner: '', repo: '' };
    const cleanUrl = repoUrl.replace("https://github.com/", "").replace("http://github.com/", "");
    const parts = cleanUrl.split("/").filter(p => p);
    return {
      owner: parts[0] || '',
      repo: parts[1] || ''
    };
  };

  const handleDestroy = async (e) => {
    e.preventDefault();
    if (destroyConfirmInput.trim() !== 'DESTROY') return;

    try {
      setDestroying(true);
      setDestroyError('');
      const res = await apiClient.post(`/repos/generations/${generationId}/destroy`, {
        branch: commitBranch || 'code2cloud-setup',
        merge_to_default: mergeToDefault
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to dispatch teardown workflow.');
      }

      const resData = await res.json();
      setDestroySuccessMsg(resData.message || 'The destroy.yml workflow was triggered on GitHub Actions.');
      setDestroySuccess(true);
      setLatestDestroyRun(null);
      setDestroyModalOpen(false);
      setPolling(true);
      setTimeout(() => {
        fetchWorkflowStatus();
      }, 1500);
    } catch (err) {
      setDestroyError(err.message || 'An error occurred while triggering teardown.');
    } finally {
      setDestroying(false);
    }
  };

  const handleCommit = async (e) => {
    e.preventDefault();
    try {
      setCommitting(true);
      setCommitError('');
      setCommitResult(null);

      let secretsPayload = null;
      if (pushSecretsToGitHub) {
        const cloudProv = (cloud || 'aws').toLowerCase();
        let manualData = null;
        
        if (secretsSource === 'manual') {
          if (cloudProv === 'aws') {
            manualData = {
              aws_access_key_id: manualAccessKey.trim(),
              aws_secret_access_key: manualSecretKey.trim(),
              aws_region: manualRegion.trim() || genRegion || 'us-east-1'
            };
            if (manualSessionToken.trim()) {
              manualData.aws_session_token = manualSessionToken.trim();
            }
          } else if (cloudProv === 'gcp') {
            manualData = {
              gcp_sa_key: manualGcpSaKey.trim(),
              gcp_project_id: manualGcpProjectId.trim(),
              gcp_region: manualRegion.trim() || genRegion || 'us-central1'
            };
          }
        }

        secretsPayload = {
          push_to_github: true,
          provider: cloudProv,
          credential_id: secretsSource === 'saved' ? selectedCloudCred : null,
          manual_data: manualData,
          save_to_profile: secretsSource === 'manual' && saveToProfile,
          profile_name: profileName.trim() || `${(cloud || 'Cloud').toUpperCase()} Deployment Credentials`
        };
      }
      
      const res = await apiClient.post(`/repos/generations/${generationId}/commit`, {
        branch: commitBranch,
        commit_message: commitMessage,
        secrets_payload: secretsPayload,
        app_env_vars: postDeployEnvVars,
        merge_to_default: mergeToDefault
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
      const res = await apiClient.get(`/repos/${owner}/${repo}/actions/runs?branch=${commitBranch}&generation_id=${generationId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          const deployRun = data.latest_deploy_run || data.latest_run || null;
          const destroyRun = data.latest_destroy_run || null;
          setLatestDeployRun(deployRun);
          setLatestRun(deployRun);
          setLatestDestroyRun(destroyRun);

          const destroyed = Boolean(data.is_destroyed);
          setIsTornDown(destroyed);

          if (destroyed) {
            setLiveEndpoints([]);
            setServerUrl('');
            setServerIp('');
          } else if (deployRun) {
            if (deployRun.endpoints && deployRun.endpoints.length > 0) {
              setLiveEndpoints(deployRun.endpoints);
            }
            if (deployRun.server_url) {
              setServerUrl(deployRun.server_url);
            }
            if (deployRun.server_ip) {
              setServerIp(deployRun.server_ip);
            }
          }

          const isAnyRunning =
            (deployRun && (deployRun.status === 'queued' || deployRun.status === 'in_progress')) ||
            (destroyRun && (destroyRun.status === 'queued' || destroyRun.status === 'in_progress'));
          setPolling(Boolean(isAnyRunning));
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
        region: genRegion,
        environment: genEnv,
        storageSizeGb: genStorage,
        swapEnabled: genSwapEnabled,
        swapSizeGb: genSwapSizeGb,
        dbEnabled: genDbEnabled,
        dbEngine: genDbEngine,
        awsComputeChoice,
        awsInstanceType,
        awsUseEip,
        gcpComputeChoice,
        gcpMachineType,
        gcpUseStaticIp,
        componentConfigs
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
        const currentServiceId = data.service_id || '';
        setServiceId(currentServiceId);
        if (currentServiceId === 'docker') {
          setCommitMessage('ci: Dockerfile created via Code2Cloud');
        } else if (currentServiceId === 'terraform_script' || currentServiceId === 'terraform_only') {
          setCommitMessage('ci: add Terraform IaC scripts via Code2Cloud');
        } else if (currentServiceId === 'cloud_deploy' || currentServiceId === 'terraform') {
          setCommitMessage('ci: add cloud deployment configurations via Code2Cloud');
        } else {
          setCommitMessage('ci: add generated deployment configurations via Code2Cloud');
        }
        setRegistryType(data.registry_type || 'native');
        setGenRegion(data.region || (data.cloud?.toLowerCase() === 'aws' ? 'us-east-1' : 'us-central1'));
        setGenEnv(data.environment || 'production');
        setGenStorage(data.storage_size_gb || 20);
        setGenSwapEnabled(data.swap_enabled || false);
        setGenSwapSizeGb(data.swap_size_gb || 2);
        setGenDbEnabled(data.db_enabled || false);
        setGenDbEngine(data.db_engine || 'postgres');
        setAwsComputeChoice(data.aws_compute_choice || 'ec2');
        setAwsInstanceType(data.aws_instance_type || 't3.micro');
        setAwsUseEip(data.aws_use_eip !== undefined ? data.aws_use_eip : true);
        setGcpComputeChoice(data.gcp_compute_choice || 'cloudrun');
        setGcpMachineType(data.gcp_machine_type || 'e2-micro');
        setGcpUseStaticIp(data.gcp_use_static_ip || false);
        setComponentConfigs(data.component_configs || {});
        setPostDeployEnvVars(data.env_vars || {});
        if (data.destroyed) {
          setIsTornDown(true);
          setLiveEndpoints([]);
          setServerUrl('');
          setServerIp('');
        } else {
          if (data.endpoints && data.endpoints.length > 0) {
            setLiveEndpoints(data.endpoints);
          }
          if (data.server_url) {
            setServerUrl(data.server_url);
          }
          if (data.server_ip) {
            setServerIp(data.server_ip);
          }
        }

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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1rem' }}>
      
      {/* Top Structured Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        paddingBottom: '0.2rem'
      }}>
        {/* Row 1: Breadcrumb & Context Meta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: '#a2a2b5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => navigate('/services')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--c2c-border)',
                color: '#a2a2b5',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#a2a2b5';
                e.currentTarget.style.borderColor = 'var(--c2c-border)';
              }}
            >
              <ArrowLeft size={13} />
              Back to Services
            </button>

            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>/</span>

            <span style={{ fontSize: '0.78rem', color: '#6e7191', fontFamily: 'monospace' }}>
              ID: <span style={{ color: '#a2a2b5' }}>{generationId}</span>
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              letterSpacing: '0.02em'
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }}></span>
              Hot/Cold Synced
            </span>
          </div>

          {/* Secondary Utility Actions (Download & Env) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setEnvModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--c2c-border)',
                color: '#c2c2d6',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--c2c-green)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--c2c-border)';
                e.currentTarget.style.color = '#c2c2d6';
              }}
            >
              <KeyRound size={13} style={{ color: 'var(--c2c-green)' }} />
              Env Variables
            </button>

            {url && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--c2c-border)',
                  color: '#c2c2d6',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontWeight: '500',
                  fontSize: '0.78rem',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--c2c-border)';
                  e.currentTarget.style.color = '#c2c2d6';
                }}
              >
                {downloading ? (
                  <RefreshCw size={13} className="loading-spinner" />
                ) : (
                  <Download size={13} />
                )}
                Download ZIP
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Main Project Heading & Primary Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem'
        }}>
          {/* Left: Prominent Project Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: '700',
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {projectName}
            </h1>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              padding: '0.2rem 0.55rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#a2a2b5',
              letterSpacing: '0.04em',
              flexShrink: 0
            }}>
              {cloud?.toUpperCase() || 'CLOUD'}
            </span>
          </div>

          {/* Right: Primary Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: saveSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: saveSuccess ? '1.5px solid #10B981' : '1.5px solid var(--c2c-border)',
                color: saveSuccess ? '#10B981' : '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (!saveSuccess) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseOut={(e) => {
                if (!saveSuccess) e.currentTarget.style.borderColor = 'var(--c2c-border)';
              }}
            >
              {saving ? (
                <RefreshCw size={15} className="loading-spinner" />
              ) : saveSuccess ? (
                <Check size={15} />
              ) : (
                <Save size={15} />
              )}
              {saving ? 'Saving...' : saveSuccess ? 'Changes Saved!' : 'Save Hot Tier'}
            </button>

            <button
              onClick={() => {
                if (isDeployRunning || committing) return;
                if (!commitMessage || commitMessage === 'ci: add generated deployment configurations via Code2Cloud') {
                  if (serviceId === 'docker') {
                    setCommitMessage('ci: Dockerfile created via Code2Cloud');
                  } else if (serviceId === 'terraform_script' || serviceId === 'terraform_only') {
                    setCommitMessage('ci: add Terraform IaC scripts via Code2Cloud');
                  } else if (serviceId === 'cloud_deploy' || serviceId === 'terraform') {
                    setCommitMessage('ci: add cloud deployment configurations via Code2Cloud');
                  }
                }
                setCommitModalOpen(true);
              }}
              disabled={isDeployRunning || committing}
              title={isDeployRunning ? 'Deployment pipeline is currently running. Please wait for completion before committing new changes.' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: isDeployRunning ? 'rgba(255, 255, 255, 0.03)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: isDeployRunning ? '1.5px solid rgba(255, 255, 255, 0.1)' : '1.5px solid var(--c2c-green)',
                color: isDeployRunning ? '#6e7191' : 'var(--c2c-green)',
                padding: '0.5rem 1.15rem',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: isDeployRunning || committing ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                opacity: isDeployRunning ? 0.6 : 1,
                boxShadow: isDeployRunning ? 'none' : '0 2px 10px rgba(16, 185, 129, 0.15)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (isDeployRunning) return;
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                if (isDeployRunning) return;
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.08) 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isDeployRunning ? (
                <RefreshCw size={15} style={{ animation: 'spin 1.5s linear infinite' }} />
              ) : (
                <GitCommit size={15} />
              )}
              {isDeployRunning ? 'Deployment Running...' : (committing ? 'Committing...' : (serviceId === 'docker' ? 'Commit to GitHub' : (isTerraformScriptOnly ? 'Commit Terraform' : 'Commit & Deploy')))}
            </button>
          </div>
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
        {isCloudDeploy && (cloud.toLowerCase() === 'aws' || cloud.toLowerCase() === 'gcp') && (
          <div style={{
            width: '360px',
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

            {/* Infrastructure Specs Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--c2c-border)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#a2a2b5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Infrastructure Specs</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem' }}>
                <div><span style={{ color: '#6e7191' }}>Region:</span> <strong style={{ color: '#fff' }}>{genRegion}</strong></div>
                <div><span style={{ color: '#6e7191' }}>Env:</span> <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{genEnv}</strong></div>
                <div><span style={{ color: '#6e7191' }}>Storage:</span> <strong style={{ color: '#fff' }}>{genStorage} GB SSD</strong></div>
                <div><span style={{ color: '#6e7191' }}>Swap:</span> <strong style={{ color: genSwapEnabled ? '#10B981' : '#a2a2b5' }}>{genSwapEnabled ? `${genSwapSizeGb} GB` : 'None'}</strong></div>
                <div><span style={{ color: '#6e7191' }}>Database:</span> <strong style={{ color: genDbEnabled ? '#10B981' : '#a2a2b5' }}>{genDbEnabled ? genDbEngine.toUpperCase() : 'None'}</strong></div>
              </div>
            </div>

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#a2a2b5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Deployment Pipeline
                </span>
                {isTornDown && (
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#ff8585', background: 'rgba(255, 107, 107, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    Torn Down
                  </span>
                )}
              </div>

              {latestDeployRun ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.01)', border: '2px solid var(--c2c-border)', padding: '1rem', borderRadius: '16px' }}>
                  
                  {/* Status Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: latestDeployRun.status === 'completed' 
                          ? (latestDeployRun.conclusion === 'success' ? '#10B981' : '#ff6b6b') 
                          : 'var(--c2c-green)',
                        animation: latestDeployRun.status !== 'completed' ? 'pulse 1.5s infinite' : 'none'
                      }}></span>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff', textTransform: 'capitalize' }}>
                        {`${latestDeployRun.status} (${latestDeployRun.conclusion || 'running'})`}
                      </span>
                    </div>
                    
                    {latestDeployRun.html_url && (
                      <a 
                        href={latestDeployRun.html_url} 
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
                        background: latestDeployRun.status === 'completed' 
                          ? '#10B981' 
                          : (latestDeployRun.status === 'in_progress' ? 'var(--c2c-green)' : '#6e7191')
                      }}></span>
                      <span style={{ fontSize: '0.75rem', color: latestDeployRun.status === 'in_progress' ? 'var(--c2c-green)' : 'var(--c2c-text-secondary)' }}>
                        Build & Push Container ({latestDeployRun.status === 'completed' ? 'Success' : latestDeployRun.status === 'in_progress' ? 'Running' : 'Pending'})
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
                        background: latestDeployRun.status === 'completed' && latestDeployRun.conclusion === 'success'
                          ? '#10B981' 
                          : (latestDeployRun.status === 'completed' && latestDeployRun.conclusion !== 'success' ? '#ff6b6b' : '#6e7191')
                      }}></span>
                      <span style={{ fontSize: '0.75rem', color: latestDeployRun.status === 'completed' ? '#fff' : '#a2a2b5' }}>
                        Terraform Infrastructure Apply ({latestDeployRun.status === 'completed' ? (latestDeployRun.conclusion === 'success' ? 'Success' : 'Failed') : 'Pending'})
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

            {/* Live Cloud Application Endpoints */}
            {isServerLive && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 27, 42, 0.6) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '20px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: '0 8px 32px -8px rgba(16, 185, 129, 0.2)'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '999px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      letterSpacing: '0.04em'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#10B981',
                        boxShadow: '0 0 8px #10B981'
                      }}></span>
                      LIVE IN CLOUD
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>
                      Running Application
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    fontWeight: '700',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#a2a2b5'
                  }}>
                    {cloud?.toUpperCase() || 'CLOUD'}
                  </span>
                </div>

                {/* Primary Action Button */}
                {computedServerUrl && (
                  <a
                    href={computedServerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      width: '100%',
                      padding: '0.85rem 1rem',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#ffffff',
                      borderRadius: '12px',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.35)';
                    }}
                  >
                    <Globe size={18} />
                    Open Application in Browser
                    <ExternalLink size={15} />
                  </a>
                )}

                {/* Primary Server IP Box */}
                {computedServerIp && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#a2a2b5', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>
                        Server Public IP
                      </span>
                      <span style={{ fontSize: '0.92rem', fontFamily: 'monospace', fontWeight: '700', color: '#10B981' }}>
                        {computedServerIp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(computedServerIp, 'primary-ip')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: copiedKey === 'primary-ip' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${copiedKey === 'primary-ip' ? '#10B981' : 'rgba(255, 255, 255, 0.12)'}`,
                        color: copiedKey === 'primary-ip' ? '#10B981' : '#fff',
                        borderRadius: '8px',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {copiedKey === 'primary-ip' ? <Check size={13} /> : <Copy size={13} />}
                      {copiedKey === 'primary-ip' ? 'Copied' : 'Copy IP'}
                    </button>
                  </div>
                )}

                {/* Multi-Service / Monorepo Breakdown */}
                {liveEndpoints && liveEndpoints.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', color: '#a2a2b5', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Deployed Services ({liveEndpoints.length})
                      </span>
                      {latestRun?.html_url && (
                        <a
                          href={latestRun.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.7rem', color: '#10B981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          GHA Summary <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {liveEndpoints.map((ep, idx) => {
                        const isDb = ep.type === 'database';
                        const epUrl = sanitizeIp(ep.url);
                        const epIp = sanitizeIp(ep.ip);
                        const epEndpoint = sanitizeIp(ep.endpoint);
                        const isHttps = Boolean(epUrl && epUrl.startsWith('https://'));
                        const epCopyVal = epEndpoint || epUrl || (epIp ? `https://${epIp.replace(/\./g, '-')}.sslip.io` : '');
                        const epKey = `ep-${idx}-${ep.name}`;
                        const isCopied = copiedKey === epKey;

                        return (
                          <div
                            key={epKey}
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '12px',
                              padding: '0.75rem 0.85rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.55rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {/* Top Row: Service Icon, Name & Type Badge, and Open Button */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                <div style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '7px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isDb ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: isDb ? '#F59E0B' : '#60A5FA',
                                  flexShrink: 0
                                }}>
                                  {isDb ? <Database size={14} /> : <Server size={14} />}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#fff', textTransform: 'capitalize' }}>
                                    {ep.name || (isDb ? 'Database' : 'Service')}
                                  </span>
                                  <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    padding: '0.12rem 0.4rem',
                                    borderRadius: '4px',
                                    background: isDb ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                                    color: isDb ? '#F59E0B' : '#10B981',
                                    letterSpacing: '0.03em'
                                  }}>
                                    {ep.type || 'service'}
                                  </span>
                                  {isHttps && (
                                    <span style={{
                                      fontSize: '0.6rem',
                                      fontWeight: '700',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem',
                                      padding: '0.12rem 0.35rem',
                                      borderRadius: '4px',
                                      background: 'rgba(16, 185, 129, 0.2)',
                                      color: '#34d399',
                                      letterSpacing: '0.02em'
                                    }} title="SSL/TLS Encrypted">
                                      <Lock size={9} /> SSL
                                    </span>
                                  )}
                                </div>
                              </div>

                              {epUrl && (
                                <a
                                  href={epUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open Service in Browser"
                                  style={{
                                    padding: '0.25rem 0.6rem',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    border: '1px solid rgba(16, 185, 129, 0.35)',
                                    borderRadius: '6px',
                                    color: '#10B981',
                                    fontSize: '0.72rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    textDecoration: 'none',
                                    flexShrink: 0,
                                    transition: 'all 0.15s'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                                  }}
                                >
                                  Open <ExternalLink size={10} />
                                </a>
                              )}
                            </div>

                            {/* Bottom Row: Full Visible Endpoint URL with 1-Click Copy */}
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.45)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              padding: '0.4rem 0.65rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, overflow: 'hidden' }}>
                                {isHttps && <Lock size={12} color="#34d399" style={{ flexShrink: 0 }} />}
                                <a
                                  href={epUrl || (epIp ? `https://${epIp.replace(/\./g, '-')}.sslip.io` : '#')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open endpoint in browser"
                                  style={{
                                    fontSize: '0.78rem',
                                    color: '#34d399',
                                    fontFamily: 'monospace',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    wordBreak: 'break-all',
                                    lineHeight: '1.3',
                                    minWidth: 0
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                                >
                                  {epUrl || epEndpoint || (epIp ? `https://${epIp.replace(/\./g, '-')}.sslip.io` : 'Ready')}
                                </a>
                              </div>

                              {epCopyVal && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(epCopyVal, epKey)}
                                  title="Copy URL or IP"
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    background: isCopied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                                    border: `1px solid ${isCopied ? '#10B981' : 'rgba(255, 255, 255, 0.12)'}`,
                                    borderRadius: '5px',
                                    color: isCopied ? '#10B981' : '#a2a2b5',
                                    fontSize: '0.68rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {isCopied ? <Check size={11} /> : <Copy size={11} />}
                                  {isCopied ? 'Copied' : (isDb ? 'Copy' : 'Copy IP')}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* If run succeeded but endpoints are still being parsed/extracted */}
                {latestRun?.status === 'completed' && latestRun?.conclusion === 'success' && !computedServerIp && !computedServerUrl && (!liveEndpoints || liveEndpoints.length === 0) && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#a2a2b5' }}>
                      Endpoints published in GitHub Actions Summary
                    </span>
                    <button
                      type="button"
                      onClick={fetchWorkflowStatus}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: 'none',
                        border: 'none',
                        color: '#10B981',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <RefreshCw size={12} /> Check Endpoints
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dedicated Teardown Cloud Resources Loading & Status Card */}
            {(isTeardownRunning || isTeardownSuccess || isTeardownFailed) && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(20, 15, 25, 0.8) 100%)',
                border: `1.5px solid ${isTeardownSuccess ? 'rgba(239, 68, 68, 0.35)' : (isTeardownRunning ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.6)')}`,
                borderRadius: '20px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
                boxShadow: isTeardownRunning ? '0 0 25px rgba(245, 158, 11, 0.2)' : 'none'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '999px',
                      background: isTeardownSuccess
                        ? 'rgba(239, 68, 68, 0.15)'
                        : (isTeardownRunning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 107, 107, 0.2)'),
                      color: isTeardownSuccess
                        ? '#ef4444'
                        : (isTeardownRunning ? '#f59e0b' : '#ff6b6b'),
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      letterSpacing: '0.04em'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isTeardownSuccess
                          ? '#ef4444'
                          : (isTeardownRunning ? '#f59e0b' : '#ff6b6b'),
                        boxShadow: isTeardownRunning ? '0 0 8px #f59e0b' : 'none',
                        animation: isTeardownRunning ? 'pulse 1.2s infinite' : 'none'
                      }}></span>
                      {isTeardownRunning
                        ? 'TEARDOWN IN PROGRESS'
                        : (isTeardownSuccess ? 'INFRASTRUCTURE DESTROYED' : 'TEARDOWN FAILED')}
                    </span>
                  </div>

                  {latestDestroyRun?.html_url && (
                    <a
                      href={latestDestroyRun.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#ff8585',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        textDecoration: 'none',
                        fontWeight: '600'
                      }}
                    >
                      Teardown Logs <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                {/* Title & Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff6b6b' }}>
                    <Trash2 size={16} />
                    <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>
                      Cloud Resources Teardown
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#a2a2b5', lineHeight: '1.4' }}>
                    {isTeardownRunning
                      ? 'Executing terraform destroy via GitHub Actions. Deleting compute instances, networking, security groups, and databases...'
                      : (isTeardownSuccess
                          ? 'All cloud resources have been permanently deleted and billing is terminated.'
                          : 'Teardown workflow encountered an issue. Please review the GitHub Actions logs.')}
                  </p>
                </div>

                {/* Animated Loading Strip when running */}
                {isTeardownRunning && (
                  <div style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '45%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                      borderRadius: '2px',
                      animation: 'pulse 1.5s infinite ease-in-out',
                      position: 'absolute'
                    }}></div>
                  </div>
                )}

                {/* Dedicated Teardown Steps Visualizer */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.7rem',
                  paddingLeft: '0.5rem',
                  borderLeft: '2px solid rgba(255, 107, 107, 0.15)',
                  marginLeft: '0.25rem',
                  marginTop: '0.25rem'
                }}>
                  {/* Step 1 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '-13px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444'
                    }}></span>
                    <span style={{ fontSize: '0.75rem', color: '#fff' }}>
                      Teardown Triggered (Confirmed 💥)
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '-13px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: (latestDestroyRun || isTeardownSuccess) ? '#ef4444' : (isTeardownRunning ? '#f59e0b' : '#6e7191'),
                      boxShadow: (!latestDestroyRun && isTeardownRunning) ? '0 0 6px #f59e0b' : 'none',
                      animation: (!latestDestroyRun && isTeardownRunning) ? 'pulse 1.2s infinite' : 'none'
                    }}></span>
                    <span style={{ fontSize: '0.75rem', color: (latestDestroyRun || isTeardownSuccess) ? '#fff' : (isTeardownRunning ? '#f59e0b' : '#a2a2b5') }}>
                      Cloud Credentials Authentication ({(latestDestroyRun || isTeardownSuccess) ? 'Authenticated ✅' : (isTeardownRunning ? 'Authenticating & Initializing... ⏳' : 'Pending')})
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
                      background: isTeardownSuccess
                        ? '#ef4444'
                        : (isTeardownFailed
                          ? '#ff6b6b'
                          : ((latestDestroyRun?.status === 'in_progress' || isTeardownRunning) ? '#f59e0b' : '#6e7191')),
                      boxShadow: (isTeardownRunning && (latestDestroyRun?.status === 'in_progress' || latestDestroyRun)) ? '0 0 6px #f59e0b' : 'none',
                      animation: (isTeardownRunning && (latestDestroyRun?.status === 'in_progress' || latestDestroyRun)) ? 'pulse 1.2s infinite' : 'none'
                    }}></span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: isTeardownSuccess ? '#fff' : (isTeardownFailed ? '#ff6b6b' : (isTeardownRunning ? '#f59e0b' : '#a2a2b5')),
                      fontWeight: isTeardownRunning ? '600' : '400'
                    }}>
                      Terraform Destroy Infrastructure ({
                        isTeardownSuccess
                          ? 'Destroy Complete ✅'
                          : (isTeardownFailed
                            ? 'Failed ❌'
                            : (latestDestroyRun?.status === 'in_progress'
                              ? 'Deleting Resources ⏳'
                              : (isTeardownRunning ? 'Queueing Teardown ⏳' : 'Pending')))
                      })
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone: Cloud Teardown Action - only shown when resources are live or teardown failed, and not currently running */}
            {!isTeardownRunning && !isTeardownSuccess && (isServerLive || isTeardownFailed) && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.04) 0%, rgba(255, 107, 107, 0.01) 100%)',
                border: '1.5px solid rgba(255, 107, 107, 0.25)',
                borderRadius: '20px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff6b6b' }}>
                  <Trash2 size={16} />
                  <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>Teardown Cloud Resources</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#a2a2b5', lineHeight: '1.4' }}>
                  Run <code style={{ color: '#ff8585', background: 'rgba(255,107,107,0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>terraform destroy</code> via GitHub Actions to delete all provisioned cloud resources and eliminate billing.
                </p>
                <button
                  onClick={() => {
                    setDestroyModalOpen(true);
                    setDestroyConfirmInput('');
                    setDestroyError('');
                    setDestroySuccess(false);
                  }}
                  style={{
                    background: 'rgba(255, 107, 107, 0.1)',
                    border: '1px solid rgba(255, 107, 107, 0.4)',
                    color: '#ff8585',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Trash2 size={14} />
                  {isTeardownFailed ? 'Retry Infrastructure Teardown' : 'Destroy Infrastructure'}
                </button>
              </div>
            )}

          </div>
        )}

        {/* Right Sidebar Terraform Standalone Script Panel */}
        {isTerraformScriptOnly && (
          <div style={{
            width: '360px',
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
                <Terminal size={17} style={{ color: 'var(--c2c-green)' }} />
                Terraform IaC Guide
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', color: '#a2a2b5', fontSize: '0.75rem', lineHeight: '1.3' }}>
                Standalone Infrastructure as Code scripts generated for {cloud.toUpperCase()}.
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid var(--c2c-border)', margin: 0 }} />

            {/* Infrastructure Specs Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--c2c-border)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#a2a2b5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Infrastructure Specs</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#a2a2b5' }}>Provider</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>{cloud.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#a2a2b5' }}>Region</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>{genRegion || (cloud.toLowerCase() === 'aws' ? 'us-east-1' : 'us-central1')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#a2a2b5' }}>Environment</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>{genEnv || 'production'}</span>
              </div>
              {genDbEnabled && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#a2a2b5' }}>Database</span>
                  <span style={{ color: 'var(--c2c-green)', fontWeight: '600' }}>{genDbEngine.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Quick Start Guide */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 27, 42, 0.5) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '16px',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Terminal size={15} /> Local Execution Steps
              </span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#a2a2b5', lineHeight: '1.4' }}>
                Run these standard Terraform CLI commands inside your repository to review and deploy:
              </p>
              <div style={{
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '10px',
                padding: '0.85rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: '#e2e2e9',
                lineHeight: '1.65',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ color: '#6e7191' }}># 1. Switch to terraform dir</div>
                <div style={{ color: '#10B981' }}>cd terraform</div>
                <div style={{ color: '#6e7191', marginTop: '0.45rem' }}># 2. Initialize provider modules</div>
                <div style={{ color: '#10B981' }}>terraform init</div>
                <div style={{ color: '#6e7191', marginTop: '0.45rem' }}># 3. Preview planned resources</div>
                <div style={{ color: '#10B981' }}>terraform plan</div>
                <div style={{ color: '#6e7191', marginTop: '0.45rem' }}># 4. Provision infrastructure</div>
                <div style={{ color: '#10B981' }}>terraform apply</div>
              </div>
            </div>

            {/* Standalone Action Hint */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--c2c-border)',
              borderRadius: '14px',
              padding: '0.85rem',
              fontSize: '0.75rem',
              color: '#a2a2b5',
              lineHeight: '1.5'
            }}>
              💡 No automated GitHub Actions workflows are generated for this service. You can download the files as a ZIP or commit them directly to GitHub without triggering automated cloud deployments.
            </div>
          </div>
        )}
      </div>
      
      {/* Safety-First Teardown Destroy Modal */}
      {destroyModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 10, 0.88)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: 'linear-gradient(135deg, rgba(35, 15, 15, 0.95) 0%, rgba(20, 10, 12, 0.98) 100%)',
            border: '2px solid rgba(255, 107, 107, 0.35)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
            padding: '2rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={22} />
                  Destroy Cloud Infrastructure
                </h3>
                <p style={{ margin: '0.35rem 0 0 0', color: '#a2a2b5', fontSize: '0.85rem' }}>
                  Permanently delete all provisioned cloud resources.
                </p>
              </div>
              <button
                onClick={() => setDestroyModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#a2a2b5', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {destroySuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '1rem 0' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 107, 107, 0.15)', border: '2px solid #ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={28} style={{ color: '#ff6b6b' }} />
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '600', margin: 0 }}>Teardown Pipeline Dispatched!</h4>
                  <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: '0.4rem 0 0 0' }}>
                    {destroySuccessMsg || 'The destroy.yml workflow was triggered on GitHub Actions. All cloud resources will be safely deleted.'}
                  </p>
                </div>
                <button
                  onClick={() => setDestroyModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1.5px solid var(--c2c-border)',
                    color: '#fff',
                    padding: '0.65rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                >
                  Close & Monitor Status
                </button>
              </div>
            ) : (
              <form onSubmit={handleDestroy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {destroyError && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    background: 'rgba(255, 107, 107, 0.12)',
                    border: '1.5px solid rgba(255, 107, 107, 0.4)',
                    color: '#ff8585',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                      <span>{destroyError}</span>
                    </div>
                    {repoUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,107,107,0.25)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#e2e2e9' }}>You can also run teardown directly on GitHub:</span>
                        <a
                          href={`https://github.com/${getOwnerAndRepo().owner}/${getOwnerAndRepo().repo}/actions/workflows/destroy.yml`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#fff',
                            background: 'rgba(255, 107, 107, 0.25)',
                            padding: '0.35rem 0.7rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          Run on GitHub <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  background: 'rgba(255, 107, 107, 0.06)',
                  border: '1px solid rgba(255, 107, 107, 0.25)',
                  borderRadius: '12px',
                  padding: '0.9rem 1rem',
                  fontSize: '0.82rem',
                  color: '#e2e2e9',
                  lineHeight: '1.45'
                }}>
                  <strong style={{ color: '#ff6b6b' }}>Warning:</strong> This will execute <code style={{ color: '#ff8585' }}>terraform destroy</code> to terminate all compute instances, unmount persistent SSD storage, and delete managed databases. This action cannot be undone.
                </div>

                {/* Auto-merge to default branch checkbox */}
                <div
                  onClick={() => setMergeToDefault(!mergeToDefault)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    id="mergeToDefaultCheck"
                    checked={mergeToDefault}
                    onChange={(e) => setMergeToDefault(e.target.checked)}
                    style={{
                      marginTop: '0.2rem',
                      cursor: 'pointer',
                      accentColor: '#ff6b6b',
                      width: '16px',
                      height: '16px'
                    }}
                  />
                  <div style={{ fontSize: '0.82rem', color: '#e2e2e9', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <GitMerge size={14} style={{ color: '#ff6b6b' }} />
                      Merge setup branch into default branch
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#a2a2b5', fontSize: '0.76rem', lineHeight: '1.35' }}>
                      GitHub Actions requires <code style={{ color: '#ff8585' }}>destroy.yml</code> to be on your repository's default branch to run teardowns. When checked, Code2Cloud will merge automatically before triggering destroy.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>
                    Type <strong style={{ color: '#ff6b6b' }}>DESTROY</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={destroyConfirmInput}
                    onChange={(e) => setDestroyConfirmInput(e.target.value)}
                    placeholder="DESTROY"
                    required
                    style={{
                      background: '#0f0f15',
                      border: '1.5px solid rgba(255, 107, 107, 0.4)',
                      color: '#fff',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    disabled={destroying}
                    onClick={() => setDestroyModalOpen(false)}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1.5px solid var(--c2c-border)',
                      color: '#a2a2b5',
                      padding: '0.7rem',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: destroying ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={destroying || destroyConfirmInput.trim() !== 'DESTROY'}
                    style={{
                      flex: 1.3,
                      background: destroyConfirmInput.trim() === 'DESTROY' ? 'linear-gradient(135deg, #ff6b6b, #e05252)' : 'rgba(255, 107, 107, 0.15)',
                      border: 'none',
                      color: destroyConfirmInput.trim() === 'DESTROY' ? '#fff' : '#6e7191',
                      padding: '0.7rem',
                      borderRadius: '10px',
                      fontWeight: '700',
                      cursor: destroying || destroyConfirmInput.trim() !== 'DESTROY' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: destroyConfirmInput.trim() === 'DESTROY' ? '0 4px 15px rgba(255, 107, 107, 0.3)' : 'none'
                    }}
                  >
                    {destroying ? (
                      <>
                        <RefreshCw size={16} className="loading-spinner" />
                        Dispatching Teardown...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Confirm Teardown
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Premium Glassmorphic Commit & Secrets Modal */}
      {commitModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 10, 0.88)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '580px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(25, 25, 35, 0.95) 0%, rgba(15, 15, 22, 0.98) 100%)',
            border: '2px solid var(--c2c-border)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            padding: '2rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            
            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <GitBranch style={{ color: 'var(--c2c-green)' }} />
                  {serviceId === 'docker' ? 'Commit Docker Configurations to GitHub' : (isTerraformScriptOnly ? 'Commit Terraform Scripts to GitHub' : 'Commit & Deploy to GitHub')}
                </h3>
                <p style={{ margin: '0.35rem 0 0 0', color: '#a2a2b5', fontSize: '0.85rem' }}>
                  {serviceId === 'docker' 
                    ? 'Commit generated Dockerfile and container configurations directly to your repository.' 
                    : (isTerraformScriptOnly
                        ? 'Commit generated Terraform Infrastructure as Code scripts directly to your repository.'
                        : 'Overlay configurations and automatically provision GitHub Actions secrets.')}
                </p>
              </div>
              <button
                onClick={() => {
                  setCommitModalOpen(false);
                  setCommitResult(null);
                  setCommitError('');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: '#a2a2b5',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}
              >
                ✕
              </button>
            </div>

            {commitResult ? (
              // Success View
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.2rem', padding: '1rem 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={32} style={{ color: '#10B981' }} />
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>Commit Published Successfully!</h4>
                  <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                    Configurations committed to the <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.45rem', borderRadius: '6px', color: 'var(--c2c-green)', fontWeight: '600' }}>{commitResult.branch}</code> branch.
                  </p>
                </div>

                {commitResult.secrets_pushed && commitResult.pushed_secrets && commitResult.pushed_secrets.length > 0 && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1.5px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '14px',
                    padding: '1rem',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}>
                    <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={16} />
                      Encrypted & Pushed to GitHub Actions Secrets:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {commitResult.pushed_secrets.map((secName) => (
                        <span key={secName} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#fff', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: '600' }}>
                          ✓ {secName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {commitResult.default_branch_synced && commitResult.branch !== commitResult.default_branch && (
                  <div style={{
                    width: '100%',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1.5px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '14px',
                    padding: '0.85rem 1rem',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}>
                    <GitMerge size={18} style={{ color: '#60a5fa', flexShrink: 0 }} />
                    <span style={{ color: '#e2e2e9', fontSize: '0.82rem' }}>
                      Synchronized with default branch <code style={{ color: '#60a5fa', fontWeight: '600' }}>{commitResult.default_branch}</code>
                      {commitResult.merged_to_default ? (serviceId === 'docker' ? ' (Dockerfile merged into default branch)' : (isTerraformScriptOnly ? ' (Terraform scripts merged into default branch)' : ' (deployment configurations merged into default branch)')) : ''}.
                    </span>
                  </div>
                )}
                
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
                      padding: '0.8rem',
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
                      padding: '0.8rem',
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

                {/* Branch & Message Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>TARGET BRANCH</label>
                    <input
                      type="text"
                      value={commitBranch}
                      onChange={(e) => setCommitBranch(e.target.value)}
                      placeholder="e.g. code2cloud-setup"
                      required
                      style={{
                        background: 'var(--c2c-surface)',
                        border: '1.5px solid var(--c2c-border)',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a2a2b5' }}>COMMIT MESSAGE</label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder={serviceId === 'docker' ? 'e.g. ci: Dockerfile created via Code2Cloud' : (isTerraformScriptOnly ? 'e.g. ci: add Terraform scripts' : 'e.g. ci: add cloud setup')}
                      required
                      style={{
                        background: 'var(--c2c-surface)',
                        border: '1.5px solid var(--c2c-border)',
                        color: '#fff',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Branch Synchronization Setting */}
                <div
                  onClick={() => setMergeToDefault(!mergeToDefault)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: mergeToDefault ? '1.5px solid rgba(59, 130, 246, 0.4)' : '1.5px solid var(--c2c-border)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <GitMerge size={17} style={{ color: mergeToDefault ? '#60a5fa' : '#a2a2b5', flexShrink: 0 }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>
                        Synchronize with Default Branch (main/master)
                      </div>
                      <div style={{ color: '#a2a2b5', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                        Pulls latest code from default branch into <code style={{ color: '#60a5fa' }}>{commitBranch || 'code2cloud-setup'}</code> before deploying, and initializes <code style={{ color: '#10B981' }}>Code2Cloud-Deploy</code> for future app CD.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="mergeToDefaultCommitCheck"
                    checked={mergeToDefault}
                    onChange={(e) => setMergeToDefault(e.target.checked)}
                    style={{
                      cursor: 'pointer',
                      accentColor: '#3b82f6',
                      width: '18px',
                      height: '18px',
                      flexShrink: 0
                    }}
                  />
                </div>

                {/* Cloud Secrets Setup Section - only for automated Cloud Deployment */}
                {isCloudDeploy && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: pushSecretsToGitHub ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1.5px solid var(--c2c-border)',
                  borderRadius: '16px',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Key size={17} style={{ color: pushSecretsToGitHub ? '#10B981' : '#a2a2b5' }} />
                      <div>
                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>GitHub Actions Cloud Secrets</span>
                        <span style={{ display: 'block', color: '#a2a2b5', fontSize: '0.75rem' }}>
                          Push credentials directly to GitHub repository secrets
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="pushSecretsToggle"
                      checked={pushSecretsToGitHub}
                      onChange={(e) => setPushSecretsToGitHub(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                    />
                  </div>

                  {pushSecretsToGitHub && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.8rem' }}>
                      
                      {/* Segmented Mode Selector: Saved vs Manual */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--c2c-border)' }}>
                        <button
                          type="button"
                          onClick={() => setSecretsSource('saved')}
                          style={{
                            background: secretsSource === 'saved' ? 'var(--c2c-selected-bg)' : 'transparent',
                            border: secretsSource === 'saved' ? '1.5px solid #10B981' : 'none',
                            color: secretsSource === 'saved' ? '#10B981' : '#a2a2b5',
                            padding: '0.45rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Use Saved Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => setSecretsSource('manual')}
                          style={{
                            background: secretsSource === 'manual' ? 'var(--c2c-selected-bg)' : 'transparent',
                            border: secretsSource === 'manual' ? '1.5px solid #10B981' : 'none',
                            color: secretsSource === 'manual' ? '#10B981' : '#a2a2b5',
                            padding: '0.45rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Enter Credentials Manually
                        </button>
                      </div>

                      {/* Saved Profile Mode */}
                      {secretsSource === 'saved' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '500' }}>Select Saved Cloud Account</label>
                          {savedCredentials.filter(c => c.provider === (cloud || 'aws').toLowerCase()).length > 0 ? (
                            <select
                              value={selectedCloudCred}
                              onChange={(e) => setSelectedCloudCred(e.target.value)}
                              style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.6rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                            >
                              {savedCredentials
                                .filter(c => c.provider === (cloud || 'aws').toLowerCase())
                                .map((cred) => (
                                  <option key={cred.credential_id} value={cred.credential_id}>
                                    {cred.name} ({cred.provider.toUpperCase()} • {cred.data?.aws_access_key_id || cred.data?.gcp_project_id || 'Configured'})
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--c2c-border)', borderRadius: '10px', fontSize: '0.8rem', color: '#a2a2b5', textAlign: 'center' }}>
                              No saved {(cloud || 'AWS').toUpperCase()} credentials found.
                              <button
                                type="button"
                                onClick={() => setSecretsSource('manual')}
                                style={{ display: 'block', margin: '0.4rem auto 0 auto', background: 'transparent', border: 'none', color: '#10B981', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', textDecoration: 'underline' }}
                              >
                                Click here to enter credentials manually
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manual Entry Mode */}
                      {secretsSource === 'manual' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {(cloud || 'aws').toLowerCase() === 'aws' ? (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600' }}>AWS Access Key ID *</label>
                                <input
                                  type="text"
                                  placeholder="AKIAIOSFODNN7EXAMPLE or ASIA..."
                                  value={manualAccessKey}
                                  onChange={(e) => setManualAccessKey(e.target.value)}
                                  required={pushSecretsToGitHub && secretsSource === 'manual'}
                                  style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                                />
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600' }}>AWS Secret Access Key *</label>
                                <input
                                  type="password"
                                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                  value={manualSecretKey}
                                  onChange={(e) => setManualSecretKey(e.target.value)}
                                  required={pushSecretsToGitHub && secretsSource === 'manual'}
                                  style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                                />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <label style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600' }}>AWS Region</label>
                                  <select
                                    value={manualRegion || genRegion || 'us-east-1'}
                                    onChange={(e) => setManualRegion(e.target.value)}
                                    style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                                  >
                                    <option value="us-east-1">us-east-1 (N. Virginia) [Default]</option>
                                    <option value="us-west-2">us-west-2 (Oregon)</option>
                                    <option value="eu-west-1">eu-west-1 (Ireland)</option>
                                    <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                                    <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                                  </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <label style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600' }}>Session Token (Optional)</label>
                                  <input
                                    type="password"
                                    placeholder="For AWS Academy / STS"
                                    value={manualSessionToken}
                                    onChange={(e) => setManualSessionToken(e.target.value)}
                                    style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <label style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600' }}>GCP Service Account Key (JSON) *</label>
                                <textarea
                                  rows={3}
                                  placeholder='{"type": "service_account", "project_id": "...", ...}'
                                  value={manualGcpSaKey}
                                  onChange={(e) => setManualGcpSaKey(e.target.value)}
                                  required={pushSecretsToGitHub && secretsSource === 'manual'}
                                  style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                                />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <label style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600' }}>GCP Project ID</label>
                                  <input
                                    type="text"
                                    placeholder="my-gcp-project"
                                    value={manualGcpProjectId}
                                    onChange={(e) => setManualGcpProjectId(e.target.value)}
                                    style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.85rem', outline: 'none' }}
                                  />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  <label style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '600' }}>GCP Region</label>
                                  <select
                                    value={manualRegion || genRegion || 'us-central1'}
                                    onChange={(e) => setManualRegion(e.target.value)}
                                    style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem 0.75rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                                  >
                                    <option value="us-central1">us-central1 (Iowa) [Default]</option>
                                    <option value="us-east1">us-east1 (S. Carolina)</option>
                                    <option value="europe-west1">europe-west1 (Belgium)</option>
                                    <option value="asia-southeast1">asia-southeast1 (Singapore)</option>
                                    <option value="asia-south1">asia-south1 (Mumbai)</option>
                                  </select>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Save to Profile Opt-in */}
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--c2c-border)', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                id="saveToProfileCheck"
                                checked={saveToProfile}
                                onChange={(e) => setSaveToProfile(e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10B981' }}
                              />
                              <label htmlFor="saveToProfileCheck" style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                                Save these credentials to my Code2Cloud profile for future deployments
                              </label>
                            </div>

                            {saveToProfile ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginLeft: '1.5rem' }}>
                                <label style={{ color: '#a2a2b5', fontSize: '0.75rem' }}>Profile Name</label>
                                <input
                                  type="text"
                                  placeholder={`e.g. My ${(cloud || 'AWS').toUpperCase()} Account`}
                                  value={profileName}
                                  onChange={(e) => setProfileName(e.target.value)}
                                  style={{ background: '#0f0f15', border: '1px solid var(--c2c-border)', borderRadius: '8px', color: '#fff', padding: '0.4rem 0.6rem', fontSize: '0.8rem', outline: 'none' }}
                                />
                              </div>
                            ) : (
                              <span style={{ color: '#10B981', fontSize: '0.72rem', marginLeft: '1.5rem' }}>
                                🔒 Zero-Storage: Secrets are encrypted and pushed directly to GitHub Actions; they will not be stored in our database.
                              </span>
                            )}
                          </div>

                        </div>
                      )}

                    </div>
                  )}
                </div>
                )}

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    disabled={committing}
                    onClick={() => {
                      setCommitModalOpen(false);
                      setCommitError('');
                    }}
                    style={{
                      flex: 0.8,
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
                      flex: 1.2,
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
                        Committing & Pushing Secrets...
                      </>
                    ) : (
                      <>
                        <GitCommit size={16} />
                        Publish Commit & Push Secrets
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Post-Deployment Runtime Environment Variables Modal */}
      {envModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 10, 0.88)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#12121a',
            border: '1.5px solid var(--c2c-border)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--c2c-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div style={{ display: 'flex', gap: '0.85rem' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '14px',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--c2c-green)',
                  flexShrink: 0
                }}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
                    Runtime Environment Variables
                  </h3>
                  <p style={{ color: '#a2a2b5', fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>
                    Configure application variables and secrets post-deployment. Saving triggers a zero-downtime rolling update without rebuilding Docker images.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnvModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#6e7191', cursor: 'pointer', fontSize: '1.25rem', padding: '0.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {envUpdateSuccess && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid var(--c2c-green)',
                  borderRadius: '12px',
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  color: '#10B981',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                    <Check size={18} />
                    <span>
                      {envWorkflowTriggered 
                        ? 'Variables pushed to GitHub Secrets & CD workflow dispatched!' 
                        : 'Variables successfully encrypted and pushed to GitHub Secrets!'}
                    </span>
                  </div>
                  {envPushedSecrets && envPushedSecrets.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#a2a2b5' }}>Secrets encrypted & synced:</span>
                      {envPushedSecrets.map((sec) => (
                        <span key={sec} style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34d399',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          fontWeight: '600'
                        }}>
                          {sec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {envUpdateError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  color: '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  <AlertCircle size={18} />
                  {envUpdateError}
                </div>
              )}

              {/* Component Sections */}
              {(Object.keys(postDeployEnvVars).length > 0 ? Object.keys(postDeployEnvVars) : ['app']).map((compName) => {
                const compEnvList = postDeployEnvVars[compName] || [];

                return (
                  <div
                    key={compName}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--c2c-border)',
                      borderRadius: '16px',
                      padding: '1.1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fff', fontSize: '0.92rem', fontWeight: '700' }}>
                        Component: <code style={{ color: 'var(--c2c-green)' }}>{compName}</code>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setEnvPasteModalComp(compName)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--c2c-border)',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.76rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <FileText size={13} />
                          Paste .env
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddPostDeployEnvVar(compName)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: 'var(--c2c-green)',
                            borderRadius: '8px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.76rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={13} />
                          Add Variable
                        </button>
                      </div>
                    </div>

                    {compEnvList.length === 0 ? (
                      <div style={{
                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#6e7191',
                        fontSize: '0.8rem'
                      }}>
                        No variables defined. Click <strong>"Add Variable"</strong> or <strong>"Paste .env"</strong> to add.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {compEnvList.map((item, idx) => {
                          const maskKey = `pd-${compName}-${idx}`;
                          const isRevealed = Boolean(envShowSecretMap[maskKey]);

                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(140px, 1fr) minmax(180px, 1.5fr) auto auto auto',
                                gap: '0.5rem',
                                alignItems: 'center',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--c2c-border)',
                                borderRadius: '10px',
                                padding: '0.4rem 0.6rem'
                              }}
                            >
                              <input
                                type="text"
                                placeholder="KEY_NAME"
                                value={item.key}
                                onChange={(e) => handleUpdatePostDeployEnvVar(compName, idx, 'key', e.target.value)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#fff',
                                  fontFamily: 'monospace',
                                  fontSize: '0.82rem',
                                  fontWeight: '600',
                                  outline: 'none',
                                  padding: '0.3rem'
                                }}
                              />
                              <input
                                type={item.is_secret && !isRevealed ? 'password' : 'text'}
                                placeholder="Value"
                                value={item.value}
                                onChange={(e) => handleUpdatePostDeployEnvVar(compName, idx, 'value', e.target.value)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#a2a2b5',
                                  fontFamily: 'monospace',
                                  fontSize: '0.82rem',
                                  outline: 'none',
                                  padding: '0.3rem'
                                }}
                              />

                              {item.is_secret ? (
                                <button
                                  type="button"
                                  onClick={() => setEnvShowSecretMap(prev => ({ ...prev, [maskKey]: !prev[maskKey] }))}
                                  title={isRevealed ? "Hide Secret" : "Reveal Secret"}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#6e7191',
                                    cursor: 'pointer',
                                    padding: '0.2rem',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                              ) : <div style={{ width: '15px' }} />}

                              <button
                                type="button"
                                onClick={() => handleUpdatePostDeployEnvVar(compName, idx, 'is_secret', !item.is_secret)}
                                title={item.is_secret ? "Sensitive Secret (Encrypted in GitHub Secrets)" : "Plaintext Configuration"}
                                style={{
                                  background: item.is_secret ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                  border: item.is_secret ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--c2c-border)',
                                  color: item.is_secret ? '#f87171' : '#6e7191',
                                  borderRadius: '6px',
                                  padding: '0.25rem 0.45rem',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                {item.is_secret ? <Lock size={12} /> : <Unlock size={12} />}
                                {item.is_secret ? 'Secret' : 'Plain'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePostDeployEnvVar(compName, idx)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#6e7191',
                                  cursor: 'pointer',
                                  padding: '0.2rem',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                                onMouseOut={(e) => { e.currentTarget.style.color = '#6e7191'; }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--c2c-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.2)',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', fontSize: '0.78rem', fontWeight: '500' }}>
                <Zap size={14} />
                <span>Zero-downtime CD in-place container refresh</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setEnvModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--c2c-border)',
                    color: '#a2a2b5',
                    borderRadius: '10px',
                    padding: '0.6rem 1.1rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePostDeployEnvVars(false)}
                  disabled={envUpdating}
                  title="Encrypt and save secrets in GitHub Actions without triggering redeployment"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--c2c-border)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '0.6rem 1.1rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: envUpdating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {envUpdatingAction === 'push_only' ? (
                    <>
                      <RefreshCw size={14} className="loading-spinner" />
                      Pushing Secrets...
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      Push Secrets Only
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePostDeployEnvVars(true, 'cd.yml')}
                  disabled={envUpdating}
                  title="Push secrets to GitHub and trigger the fast CD workflow to refresh containers"
                  style={{
                    background: 'linear-gradient(135deg, var(--c2c-green), var(--c2c-green-hover))',
                    border: 'none',
                    color: '#05050a',
                    borderRadius: '10px',
                    padding: '0.6rem 1.4rem',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    cursor: envUpdating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'
                  }}
                >
                  {envUpdatingAction === 'cd' ? (
                    <>
                      <RefreshCw size={15} className="loading-spinner" />
                      Updating & Deploying CD...
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      Push & Run CD Workflow
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paste .env Bulk Import Modal */}
      {envPasteModalComp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#12121a',
            border: '1.5px solid var(--c2c-border)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={20} style={{ color: 'var(--c2c-green)' }} />
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>
                  Paste .env for {envPasteModalComp}
                </h3>
              </div>
              <button 
                onClick={() => setEnvPasteModalComp(null)}
                style={{ background: 'none', border: 'none', color: '#a2a2b5', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#a2a2b5', fontSize: '0.82rem', margin: 0, lineHeight: '1.4' }}>
              Paste the raw contents of your <code>.env</code> file below. Lines formatted as <code>KEY=VALUE</code> will be parsed, and variables containing keywords like <em>KEY, SECRET, TOKEN, PASSWORD</em> will automatically be flagged as encrypted secrets.
            </p>

            <textarea
              value={envPasteText}
              onChange={(e) => setEnvPasteText(e.target.value)}
              placeholder={`PORT=3000\nNODE_ENV=production\nDATABASE_URL=postgres://user:pass@host:5432/db\nJWT_SECRET=your-secret-key`}
              rows={10}
              style={{
                background: '#09090d',
                border: '1.5px solid var(--c2c-border)',
                borderRadius: '12px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                padding: '0.85rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setEnvPasteModalComp(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--c2c-border)',
                  color: '#a2a2b5',
                  borderRadius: '10px',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImportPostDeployEnvPaste}
                disabled={!envPasteText.trim()}
                style={{
                  background: envPasteText.trim() ? 'var(--c2c-green)' : 'rgba(255,255,255,0.05)',
                  color: envPasteText.trim() ? '#000' : '#6e7191',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.6rem 1.4rem',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: envPasteText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Import Variables
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerationViewer;
