import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookMarked, ArrowLeft, Settings2, ChevronDown, ChevronUp, HardDrive, Database, Globe, Layers, ShieldCheck, DollarSign, Server, Cpu, Check, Sliders, Zap, ExternalLink, Sparkles, RefreshCw, Plus, Trash2, Lock, Unlock, Eye, EyeOff, KeyRound, FileText } from 'lucide-react';
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

  // Advanced Infrastructure Settings & Add-ons states
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('us-east-1');
  const [selectedRegistry, setSelectedRegistry] = useState('native');
  const [selectedEnvironment, setSelectedEnvironment] = useState('production');
  const [storageSizeGb, setStorageSizeGb] = useState(20);
  const [isCustomStorage, setIsCustomStorage] = useState(false);
  const [swapEnabled, setSwapEnabled] = useState(false);
  const [swapSizeGb, setSwapSizeGb] = useState(2);
  const [dbEnabled, setDbEnabled] = useState(false);
  const [dbEngine, setDbEngine] = useState('postgres'); // 'postgres' | 'mysql'

  // Application Environment Variables states
  const [envVars, setEnvVars] = useState({});
  const [isEnvOpen, setIsEnvOpen] = useState(true);
  const [showSecretMap, setShowSecretMap] = useState({});
  const [envPasteModalComp, setEnvPasteModalComp] = useState(null);
  const [envPasteText, setEnvPasteText] = useState('');

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
        if (response.ok) {
          const data = await response.json();
          setRepos(Array.isArray(data) ? data : []);
        } else {
          setRepos([]);
        }
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

  // Sync componentConfigs and envVars state whenever techStack changes
  useEffect(() => {
    if (techStack?.components && techStack.components.length > 0) {
      const initialConfigs = {};
      const initialEnv = { ...envVars };
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

        if (!initialEnv[compName] || initialEnv[compName].length === 0) {
          if (Array.isArray(comp.detected_env_vars) && comp.detected_env_vars.length > 0) {
            initialEnv[compName] = comp.detected_env_vars.map((v) => ({
              key: v.key,
              value: v.value || '',
              is_secret: Boolean(v.is_secret)
            }));
          } else {
            initialEnv[compName] = [];
          }
        }
      });
      setComponentConfigs(initialConfigs);
      setEnvVars(initialEnv);
    }
  }, [techStack]);

  const handleAddEnvVar = (compName) => {
    setEnvVars((prev) => ({
      ...prev,
      [compName]: [...(prev[compName] || []), { key: '', value: '', is_secret: false }]
    }));
  };

  const handleUpdateEnvVar = (compName, index, field, value) => {
    setEnvVars((prev) => {
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

  const handleDeleteEnvVar = (compName, index) => {
    setEnvVars((prev) => ({
      ...prev,
      [compName]: (prev[compName] || []).filter((_, i) => i !== index)
    }));
  };

  const handleImportEnvPaste = () => {
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

    setEnvVars((prev) => {
      const existing = prev[envPasteModalComp] || [];
      const map = new Map(existing.map((item) => [item.key, item]));
      newItems.forEach((item) => map.set(item.key, item));
      return { ...prev, [envPasteModalComp]: Array.from(map.values()) };
    });

    setEnvPasteModalComp(null);
    setEnvPasteText('');
  };

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
        const recommendedStorage = data.recommended_storage_gb || 20;
        const recommendedSwapEnabled = data.recommended_swap_enabled !== undefined ? data.recommended_swap_enabled : (['ec2', 'gce'].includes(computeChoice));
        const recommendedSwapSize = data.recommended_swap_size_gb || 2;
        const reasoning = data.reasoning;

        setAiReasons((prev) => ({ ...prev, [compName]: reasoning }));
        setAiSources((prev) => ({ ...prev, [compName]: data.source }));

        if (compName === 'global') {
          if (targetCloud === 'AWS') setAwsInstanceType(recommendedInstance);
          if (targetCloud === 'GCP') setGcpMachineType(recommendedInstance);
          setStorageSizeGb(recommendedStorage);
          setSwapEnabled(recommendedSwapEnabled);
          setSwapSizeGb(recommendedSwapSize);
        } else {
          setComponentConfigs((prev) => {
            const current = prev[compName] || {};
            return {
              ...prev,
              [compName]: {
                ...current,
                ...(targetCloud === 'AWS' ? { awsInstanceType: recommendedInstance } : { gcpMachineType: recommendedInstance }),
                storageSizeGb: recommendedStorage,
                swapEnabled: recommendedSwapEnabled,
                swapSizeGb: recommendedSwapSize
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

  const getLangColor = (lang) => {
    const colors = {
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      Python: '#3572A5',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Jinja: '#a52a22',
      HCL: '#844FBA',
      Go: '#00ADD8',
      Rust: '#dea584',
      Java: '#b07219',
      Ruby: '#701516',
      PHP: '#4F5D95',
      Dockerfile: '#384d54',
      Shell: '#89e051'
    };
    return colors[lang] || '#10B981';
  };


  useEffect(() => {
    if (selectedCloud === 'AWS') {
      setSelectedRegion((prev) => (prev && ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-south-1'].includes(prev) ? prev : 'us-east-1'));
    } else if (selectedCloud === 'GCP') {
      setSelectedRegion((prev) => (prev && ['us-central1', 'us-east1', 'europe-west1', 'asia-southeast1', 'asia-south1'].includes(prev) ? prev : 'us-central1'));
    }
  }, [selectedCloud]);

  const calculateCostBreakdown = () => {
    let computeCost = 0;
    let ipCost = 0;
    let storageCost = 0;
    let dbCost = 0;

    const HOURS_PER_MONTH = 730;

    const awsEc2Rates = { 't3.micro': 0.0104, 't3.small': 0.0208, 't3.medium': 0.0416, 't3.large': 0.0832 };
    const awsFargateRates = { '0.25 vCPU / 512 MB': 0.0125, '0.5 vCPU / 1 GB': 0.0250, '1.0 vCPU / 2 GB': 0.0500, '2.0 vCPU / 4 GB': 0.1000 };
    const gcpGceRates = { 'e2-micro': 0.0084, 'e2-small': 0.0168, 'e2-medium': 0.0335, 'e2-standard-2': 0.0670 };
    const gcpCloudRunRates = { '1 vCPU / 512 MB': 0.0100, '1 vCPU / 1 GB': 0.0150, '2 vCPU / 2 GB': 0.0300, '2 vCPU / 4 GB': 0.0450 };

    if (techStack?.components && techStack.components.length > 1) {
      techStack.components.forEach((comp) => {
        const compName = comp.name.toLowerCase().replace('/', '-').replace('\\', '-');
        const cfg = componentConfigs[compName] || {};
        if (cfg.enabled === false) return;
        const compStorage = Number(cfg.storageSizeGb) || Number(storageSizeGb) || 20;
        storageCost += compStorage * 0.08;

        if (selectedCloud === 'AWS') {
          const choice = cfg.awsComputeChoice || awsComputeChoice;
          const inst = cfg.awsInstanceType || (choice === 'fargate' ? '0.25 vCPU / 512 MB' : 't3.micro');
          const rate = choice === 'fargate' ? (awsFargateRates[inst] || 0.0125) : (awsEc2Rates[inst] || 0.0104);
          computeCost += rate * HOURS_PER_MONTH;
          if (cfg.awsUseEip || (choice === 'ec2' && awsUseEip)) {
            ipCost += 0.005 * HOURS_PER_MONTH;
          }
        } else if (selectedCloud === 'GCP') {
          const choice = cfg.gcpComputeChoice || gcpComputeChoice;
          const mach = cfg.gcpMachineType || (choice === 'cloudrun' ? '1 vCPU / 512 MB' : 'e2-micro');
          const rate = choice === 'cloudrun' ? (gcpCloudRunRates[mach] || 0.0100) : (gcpGceRates[mach] || 0.0084);
          computeCost += rate * HOURS_PER_MONTH;
          if (cfg.gcpUseStaticIp || (choice === 'gce' && gcpUseStaticIp)) {
            ipCost += 0.005 * HOURS_PER_MONTH;
          }
        }
      });
    } else {
      const storageGb = Number(storageSizeGb) || 20;
      storageCost = storageGb * 0.08;

      if (selectedCloud === 'AWS') {
        const rate = awsComputeChoice === 'fargate' ? (awsFargateRates[awsInstanceType] || 0.0125) : (awsEc2Rates[awsInstanceType] || 0.0104);
        computeCost = rate * HOURS_PER_MONTH;
        if (awsComputeChoice === 'ec2' && awsUseEip) {
          ipCost = 0.005 * HOURS_PER_MONTH;
        }
      } else if (selectedCloud === 'GCP') {
        const rate = gcpComputeChoice === 'cloudrun' ? (gcpCloudRunRates[gcpMachineType] || 0.0100) : (gcpGceRates[gcpMachineType] || 0.0084);
        computeCost = rate * HOURS_PER_MONTH;
        if (gcpComputeChoice === 'gce' && gcpUseStaticIp) {
          ipCost = 0.005 * HOURS_PER_MONTH;
        }
      }
    }

    if (dbEnabled) {
      dbCost = selectedCloud === 'AWS' ? 14.71 : 14.35;
    }

    const totalCost = computeCost + ipCost + storageCost + dbCost;

    return {
      computeCost: computeCost.toFixed(2),
      ipCost: ipCost.toFixed(2),
      storageCost: storageCost.toFixed(2),
      dbCost: dbCost.toFixed(2),
      totalCost: totalCost.toFixed(2)
    };
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
        registryType: selectedRegistry,
        region: selectedRegion || (selectedCloud === 'AWS' ? 'us-east-1' : 'us-central1'),
        environment: selectedEnvironment,
        storageSizeGb: Number(storageSizeGb) || 20,
        storageType: selectedCloud === 'AWS' ? 'gp3' : 'pd-ssd',
        dbEnabled,
        dbEngine,
        dbInstanceClass: selectedCloud === 'AWS' ? 'db.t3.micro' : 'db-f1-micro',
        dbAllocatedStorage: 20,
        swapEnabled,
        swapSizeGb: Number(swapSizeGb) || 2,
        awsComputeChoice,
        awsInstanceType,
        awsUseEip,
        gcpComputeChoice,
        gcpMachineType,
        gcpUseStaticIp,
        componentConfigs,
        envVars
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

  const sortedRepos = (Array.isArray(repos) ? [...repos] : []).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/services')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '2px solid var(--c2c-border)', color: '#a2a2b5', padding: '0.55rem 1.1rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#a2a2b5'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <ArrowLeft size={16} />
            Back to Services
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#6e7191' }}>
            <span>Services</span>
            <span>/</span>
            <span style={{ color: currentConfig.color, fontWeight: '600' }}>{currentConfig.title}</span>
          </div>
        </div>

        {selectedRepo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--c2c-border)', padding: '0.45rem 0.9rem', borderRadius: '12px' }}>
              <BookMarked size={15} style={{ color: currentConfig.color }} />
              <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>{selectedRepo.full_name}</span>
            </div>
            <button
              onClick={() => {
                setSelectedRepo(null);
                setSelectedRepoId('');
                setTechStack(null);
                setIsOpen(true);
              }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--c2c-border)',
                color: '#a2a2b5',
                padding: '0.45rem 0.85rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = currentConfig.color; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#a2a2b5'; e.currentTarget.style.borderColor = 'var(--c2c-border)'; }}
            >
              <RefreshCw size={13} />
              Switch Repo
            </button>
          </div>
        )}
      </div>

      {loadingRepos ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div className="loading-spinner" style={{ width: '36px', height: '36px' }}></div>
        </div>
      ) : error ? (
        <div style={{ background: 'rgba(255, 107, 107, 0.1)', border: '2px solid rgba(255, 107, 107, 0.3)', color: '#ff6b6b', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
          {error}
        </div>
      ) : !selectedRepo ? (
        /* Repository Selection Hero View */
        <div style={{ maxWidth: '780px', margin: '1rem auto 3rem auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: `${currentConfig.color}15`, border: `1px solid ${currentConfig.color}35`, color: currentConfig.color, padding: '0.35rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem' }}>
              <Sparkles size={14} />
              {currentConfig.title}
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: '700', marginBottom: '0.6rem', color: '#fff', letterSpacing: '-0.5px' }}>
              Choose Repository to Configure
            </h2>
            <p style={{ color: '#a2a2b5', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
              {currentConfig.description}
            </p>
          </div>

          <div style={{
            background: 'var(--c2c-surface)',
            border: '2px solid var(--c2c-border)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ color: '#fff', fontSize: '1rem', fontWeight: '600' }}>Search & Select Repository</label>
              <div style={{ position: 'relative', zIndex: 995 }}>
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
                    maxHeight: '280px',
                    zIndex: 999,
                    boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', overflowY: 'auto', maxHeight: '240px' }}>
                      {sortedRepos.filter(repo => repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                        <div style={{ padding: '1.5rem', color: '#6e7191', fontSize: '0.95rem', textAlign: 'center' }}>
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
                                  setSearchQuery('');
                                }}
                                style={{
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  color: '#fff',
                                  background: selectedRepoId === repo.id.toString() ? 'var(--c2c-selected-bg)' : 'transparent',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { if (selectedRepoId !== repo.id.toString()) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'; }}
                                onMouseOut={(e) => { if (selectedRepoId !== repo.id.toString()) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <BookMarked size={16} style={{ color: currentConfig.color }} />
                                  <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{repo.full_name}</span>
                                  {isCollaborator && (
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--c2c-green)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: '600' }}>Collaborated</span>
                                  )}
                                </div>
                                {repo.private ? <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>🔒 Private</span> : <span style={{ color: '#10B981', fontSize: '0.85rem' }}>🌐 Public</span>}
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

            {/* Feature Highlights Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--c2c-border)' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '0.4rem' }}>⚡</span>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Instant Analysis</span>
                <span style={{ color: '#a2a2b5', fontSize: '0.75rem' }}>Automated language, dependency & monorepo detection</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '0.4rem' }}>☁️</span>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Multi-Cloud Ready</span>
                <span style={{ color: '#a2a2b5', fontSize: '0.75rem' }}>Tailored configurations for AWS, GCP & Azure</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '1.2rem', display: 'block', marginBottom: '0.4rem' }}>💰</span>
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600', display: 'block' }}>Live FinOps</span>
                <span style={{ color: '#a2a2b5', fontSize: '0.75rem' }}>Real-time cost estimation per instance & resource</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2-Column Responsive Workspace Grid */
        <div className="service-setup-grid">
          
          {/* LEFT COLUMN: Repository Context & Tech Stack Insights */}
          <div style={{ position: 'sticky', top: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Repository Info Card */}
            <div style={{
              background: 'var(--c2c-surface)',
              border: '2px solid var(--c2c-border)',
              borderRadius: '20px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: `${currentConfig.color}18`,
                  border: `1px solid ${currentConfig.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentConfig.color,
                  flexShrink: 0
                }}>
                  <BookMarked size={22} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ color: '#6e7191', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Repository</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedRepo.full_name}>
                    {selectedRepo.full_name}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem',
                  background: selectedRepo.private ? 'rgba(255, 107, 107, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: selectedRepo.private ? '#ff6b6b' : '#10B981',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  border: selectedRepo.private ? '1px solid rgba(255, 107, 107, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: '600'
                }}>
                  {selectedRepo.private ? '🔒 Private' : '🌐 Public'}
                </span>

                {selectedRepo.owner?.login?.toLowerCase() !== user?.login?.toLowerCase() && (
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--c2c-green)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: '600'
                  }}>
                    Collaborated
                  </span>
                )}

                {selectedRepo.html_url && (
                  <a
                    href={selectedRepo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#a2a2b5',
                      fontSize: '0.75rem',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#a2a2b5'}
                  >
                    GitHub <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedRepo(null);
                  setSelectedRepoId('');
                  setTechStack(null);
                  setIsOpen(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--c2c-border)',
                  borderRadius: '10px',
                  color: '#a2a2b5',
                  padding: '0.55rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = currentConfig.color; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#a2a2b5'; e.currentTarget.style.borderColor = 'var(--c2c-border)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
              >
                <RefreshCw size={13} />
                Choose Different Repository
              </button>
            </div>

            {/* Tech Stack Analytics Card */}
            <div style={{
              background: 'var(--c2c-surface)',
              border: '2px solid var(--c2c-border)',
              borderRadius: '20px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Cpu size={18} style={{ color: currentConfig.color }} />
                <h4 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '600', margin: 0 }}>Tech Stack Analytics</h4>
              </div>

              {loadingStack ? (
                <Preloader 
                  message="Analyzing repository..." 
                  submessage="Scanning configuration files, dependencies, and monorepo components." 
                  color={currentConfig.color}
                />
              ) : techStack ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Languages */}
                  <div>
                    <span style={{ color: '#a2a2b5', fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '0.6rem' }}>
                      Languages Distribution
                    </span>
                    {techStack.languages && Object.keys(techStack.languages).length > 0 && (
                      <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', width: '100%', background: 'rgba(255,255,255,0.06)', marginBottom: '0.75rem' }}>
                        {calculateLanguagePercentages(techStack.languages).map((l, i) => (
                          <div key={i} style={{ width: `${l.percentage}%`, background: getLangColor(l.name) }} title={`${l.name}: ${l.percentage}%`} />
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {calculateLanguagePercentages(techStack.languages).map((l, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--c2c-border)', color: '#fff', padding: '0.25rem 0.55rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: getLangColor(l.name) }}></span>
                          <span>{l.name}</span>
                          <span style={{ color: '#a2a2b5', fontSize: '0.72rem' }}>{l.percentage}%</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sub-Projects */}
                  <div>
                    <span style={{ color: '#a2a2b5', fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '0.6rem' }}>
                      Sub-Projects Detected {techStack.components ? `(${techStack.components.length})` : ''}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {techStack.components && techStack.components.length > 0 ? (
                        techStack.components.map((comp, i) => (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--c2c-border)', borderRadius: '12px', padding: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: currentConfig.color, fontWeight: '600', fontSize: '0.9rem' }}>{comp.name}</span>
                                <span style={{ background: 'rgba(255,255,255,0.06)', color: '#a2a2b5', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{comp.type}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: '80px', overflowY: 'auto' }}>
                              {comp.libraries && comp.libraries.length > 0 ? (
                                comp.libraries.map((lib, j) => (
                                  <span key={j} style={{ background: 'rgba(255,255,255,0.04)', color: '#e2e2e9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem' }}>{lib}</span>
                                ))
                              ) : (
                                <span style={{ color: '#6e7191', fontSize: '0.72rem' }}>No external packages</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: '#a2a2b5', fontSize: '0.85rem' }}>None detected</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : <span style={{ color: '#a2a2b5', fontSize: '0.85rem' }}>Unavailable</span>}
            </div>

          </div>

          {/* RIGHT COLUMN: Deployment Configuration & Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{
              background: 'var(--c2c-surface)',
              border: '2px solid var(--c2c-border)',
              borderRadius: '24px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.4)'
            }}>

              {/* Cloud Platform Selection */}
              {serviceId !== 'docker' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '700', display: 'block', marginBottom: '0.25rem' }}>Where are you deploying this application?</label>
                    <span style={{ color: '#a2a2b5', fontSize: '0.85rem' }}>Choose your target cloud provider to customize infrastructure generation.</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {[{ id: 'AWS', name: 'AWS' }, { id: 'Azure', name: 'Azure' }, { id: 'GCP', name: 'Google Cloud' }].map((cloud) => (
                      <div 
                        key={cloud.id}
                        onClick={() => setSelectedCloud(cloud.id)}
                        style={{
                          background: selectedCloud === cloud.id ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                          border: selectedCloud === cloud.id ? `2px solid ${currentConfig.color}` : '2px solid var(--c2c-border)',
                          borderRadius: '16px', padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                          boxShadow: selectedCloud === cloud.id ? `0 0 20px ${currentConfig.color}25` : 'none'
                        }}
                      >
                        <div style={{ color: selectedCloud === cloud.id ? currentConfig.color : '#fff', fontWeight: '700', fontSize: '1rem' }}>{cloud.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Docker Service Banner */}
              {serviceId === 'docker' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(52, 211, 153, 0.05)', border: '1.5px solid rgba(52, 211, 153, 0.25)', borderRadius: '16px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: '700', fontSize: '1.05rem' }}>
                    <Sparkles size={20} />
                    <span>Automated Containerization Pipeline</span>
                  </div>
                  <p style={{ color: '#e2e2e9', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>
                    Code2Cloud will inspect all detected sub-projects and dependencies, then build multi-stage production Dockerfiles and a coordinated <code>docker-compose.yml</code> ready for instant local and cloud deployment.
                  </p>
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
                        enabled: true,
                        awsComputeChoice: awsComputeChoice,
                        awsInstanceType: awsComputeChoice === 'fargate' ? '0.25 vCPU / 512 MB' : 't3.micro',
                        awsUseEip: awsUseEip,
                        gcpComputeChoice: gcpComputeChoice,
                        gcpMachineType: gcpComputeChoice === 'cloudrun' ? '1 vCPU / 512 MB' : 'e2-micro',
                        gcpUseStaticIp: gcpUseStaticIp,
                        storageSizeGb: storageSizeGb || 20,
                        swapEnabled: false,
                        swapSizeGb: 2
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
                        <div key={compName} style={{ 
                          background: compCfg.enabled !== false ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.005)', 
                          border: compCfg.enabled !== false ? '1.5px solid var(--c2c-border)' : '1.5px dashed rgba(255, 255, 255, 0.12)', 
                          borderRadius: '16px', 
                          padding: '1.25rem',
                          opacity: compCfg.enabled !== false ? 1 : 0.65,
                          transition: 'all 0.2s'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compCfg.enabled !== false ? '1rem' : '0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{ color: compCfg.enabled !== false ? currentConfig.color : '#6e7191', fontWeight: '700', fontSize: '1rem', textTransform: 'capitalize' }}>{comp.name} Component</span>
                              <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '0.2rem 0.6rem', borderRadius: '8px', color: '#a2a2b5', fontSize: '0.75rem' }}>{comp.type}</span>
                              <span style={{ color: '#6b7280', fontSize: '0.75rem', fontFamily: 'monospace' }}>path: {comp.path}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                id={`enableComp-${compName}`}
                                checked={compCfg.enabled !== false}
                                onChange={(e) => updateCompCfg('enabled', e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: currentConfig.color }}
                              />
                              <label htmlFor={`enableComp-${compName}`} style={{ color: compCfg.enabled !== false ? '#fff' : '#a2a2b5', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}>
                                {compCfg.enabled !== false ? 'Include in Deployment' : 'Excluded from Deployment'}
                              </label>
                            </div>
                          </div>

                          {compCfg.enabled !== false && (
                            <>
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                          <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>Root SSD Disk</label>
                                          <select
                                            value={compCfg.storageSizeGb || storageSizeGb || 20}
                                            onChange={(e) => updateCompCfg('storageSizeGb', Number(e.target.value))}
                                            style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
                                          >
                                            <option value={10}>10 GB SSD ($0.80/mo)</option>
                                            <option value={20}>20 GB SSD ($1.60/mo)</option>
                                            <option value={50}>50 GB SSD ($4.00/mo)</option>
                                            <option value={100}>100 GB SSD ($8.00/mo)</option>
                                            <option value={200}>200 GB SSD ($16.00/mo)</option>
                                          </select>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                          <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>Linux Swap (Virtual RAM)</label>
                                          <select
                                            value={compCfg.swapEnabled ? (compCfg.swapSizeGb || 2) : 0}
                                            onChange={(e) => {
                                              const val = Number(e.target.value);
                                              if (val === 0) {
                                                updateCompCfg('swapEnabled', false);
                                              } else {
                                                updateCompCfg('swapEnabled', true);
                                                updateCompCfg('swapSizeGb', val);
                                              }
                                            }}
                                            style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
                                          >
                                            <option value={0}>None (Disabled)</option>
                                            <option value={1}>1 GB Swap ($0.00)</option>
                                            <option value={2}>2 GB Swap (Recommended)</option>
                                            <option value={3}>3 GB Swap ($0.00)</option>
                                            <option value={4}>4 GB Swap ($0.00)</option>
                                          </select>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                          type="checkbox"
                                          id={`awsUseEip-${compName}`}
                                          checked={compCfg.awsUseEip || false}
                                          onChange={(e) => updateCompCfg('awsUseEip', e.target.checked)}
                                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: currentConfig.color }}
                                        />
                                        <label htmlFor={`awsUseEip-${compName}`} style={{ color: '#fff', fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none' }}>
                                          Allocate Elastic IP (Static Public IP)
                                        </label>
                                      </div>
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                          <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>Root SSD Disk</label>
                                          <select
                                            value={compCfg.storageSizeGb || storageSizeGb || 20}
                                            onChange={(e) => updateCompCfg('storageSizeGb', Number(e.target.value))}
                                            style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
                                          >
                                            <option value={10}>10 GB SSD ($0.80/mo)</option>
                                            <option value={20}>20 GB SSD ($1.60/mo)</option>
                                            <option value={50}>50 GB SSD ($4.00/mo)</option>
                                            <option value={100}>100 GB SSD ($8.00/mo)</option>
                                            <option value={200}>200 GB SSD ($16.00/mo)</option>
                                          </select>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                          <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>Linux Swap (Virtual RAM)</label>
                                          <select
                                            value={compCfg.swapEnabled ? (compCfg.swapSizeGb || 2) : 0}
                                            onChange={(e) => {
                                              const val = Number(e.target.value);
                                              if (val === 0) {
                                                updateCompCfg('swapEnabled', false);
                                              } else {
                                                updateCompCfg('swapEnabled', true);
                                                updateCompCfg('swapSizeGb', val);
                                              }
                                            }}
                                            style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.55rem', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
                                          >
                                            <option value={0}>None (Disabled)</option>
                                            <option value={1}>1 GB Swap ($0.00)</option>
                                            <option value={2}>2 GB Swap (Recommended)</option>
                                            <option value={3}>3 GB Swap ($0.00)</option>
                                            <option value={4}>4 GB Swap ($0.00)</option>
                                          </select>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                    </div>
                                  )}
                                  {renderAiReasoning(compName)}
                                </div>
                              )}
                            </>
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

              {/* FinOps Real-time Cost Estimation Card */}
              {selectedCloud && serviceId !== 'docker' && (
                <div style={{
                  borderTop: '2px solid var(--c2c-border)',
                  paddingTop: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
                    border: '1.5px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={18} style={{ color: '#10B981' }} />
                        <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>Live FinOps Cost Estimation</span>
                      </div>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10B981',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        border: '1px solid rgba(16, 185, 129, 0.4)'
                      }}>
                        ${calculateCostBreakdown().totalCost} / month
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#e2e2e9', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--c2c-border)' }}>
                        Compute: <strong>${calculateCostBreakdown().computeCost}/mo</strong>
                      </span>
                      <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#e2e2e9', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--c2c-border)' }}>
                        Storage ({storageSizeGb}GB): <strong>${calculateCostBreakdown().storageCost}/mo</strong>
                      </span>
                      {(awsUseEip || gcpUseStaticIp || Object.values(componentConfigs).some(c => c.awsUseEip || c.gcpUseStaticIp)) && (
                        <span style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#e2e2e9', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid var(--c2c-border)' }}>
                          Static IP: <strong>+${calculateCostBreakdown().ipCost}/mo</strong>
                        </span>
                      )}
                      {dbEnabled && (
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          Managed DB ({dbEngine.toUpperCase()}): <strong>+${calculateCostBreakdown().dbCost}/mo</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Infrastructure Settings Accordion */}
              {selectedCloud && serviceId === 'terraform' && (
                <div style={{
                  borderTop: '2px solid var(--c2c-border)',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div 
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: isAdvancedOpen ? `1.5px solid ${currentConfig.color}` : '1.5px solid var(--c2c-border)',
                      borderRadius: '16px',
                      padding: '1rem 1.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Sliders size={18} style={{ color: currentConfig.color }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>Advanced Infrastructure Settings</span>
                        <span style={{ color: '#a2a2b5', fontSize: '0.75rem' }}>
                          Region: <strong style={{ color: '#fff' }}>{selectedRegion}</strong> • Registry: <strong style={{ color: '#fff' }}>{selectedRegistry === 'native' ? (selectedCloud === 'AWS' ? 'ECR' : 'GAR') : 'DockerHub'}</strong> • Env: <strong style={{ color: '#fff' }}>{selectedEnvironment}</strong> {techStack?.components && techStack.components.length > 1 ? (<>• Storage & Swap: <strong style={{ color: '#fff' }}>Per-Component</strong></>) : (<>• Storage: <strong style={{ color: '#fff' }}>{storageSizeGb}GB</strong> {swapEnabled && `• Swap: ${swapSizeGb}GB`}</>)} {dbEnabled && `• DB: ${dbEngine.toUpperCase()}`}
                        </span>
                      </div>
                    </div>
                    {isAdvancedOpen ? <ChevronUp size={18} style={{ color: '#a2a2b5' }} /> : <ChevronDown size={18} style={{ color: '#a2a2b5' }} />}
                  </div>

                  {isAdvancedOpen && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1.5px solid var(--c2c-border)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                      marginTop: '0.25rem'
                    }}>
                      {/* 1. Region Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Globe size={15} style={{ color: currentConfig.color }} />
                          Deployment Region
                        </label>
                        <select
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value)}
                          style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.65rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                        >
                          {selectedCloud === 'AWS' ? (
                            <>
                              <option value="us-east-1">us-east-1 (US East - N. Virginia) [Default]</option>
                              <option value="us-west-2">us-west-2 (US West - Oregon)</option>
                              <option value="eu-west-1">eu-west-1 (Europe - Ireland)</option>
                              <option value="ap-southeast-1">ap-southeast-1 (Asia Pacific - Singapore)</option>
                              <option value="ap-south-1">ap-south-1 (Asia Pacific - Mumbai)</option>
                            </>
                          ) : (
                            <>
                              <option value="us-central1">us-central1 (US Central - Iowa) [Default]</option>
                              <option value="us-east1">us-east1 (US East - S. Carolina)</option>
                              <option value="europe-west1">europe-west1 (Europe - Belgium)</option>
                              <option value="asia-southeast1">asia-southeast1 (Asia Pacific - Singapore)</option>
                              <option value="asia-south1">asia-south1 (Asia Pacific - Mumbai)</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* 2. Container Registry Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Layers size={15} style={{ color: currentConfig.color }} />
                          Container Image Registry
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                          {[
                            { id: 'native', name: selectedCloud === 'AWS' ? 'Amazon ECR (Native)' : 'Google Artifact Registry (Native)' },
                            { id: 'dockerhub', name: 'Docker Hub' }
                          ].map((reg) => (
                            <div
                              key={reg.id}
                              onClick={() => setSelectedRegistry(reg.id)}
                              style={{
                                background: selectedRegistry === reg.id ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                                border: selectedRegistry === reg.id ? `2px solid ${currentConfig.color}` : '1.5px solid var(--c2c-border)',
                                borderRadius: '10px',
                                padding: '0.65rem 0.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.82rem',
                                color: selectedRegistry === reg.id ? currentConfig.color : '#fff',
                                transition: 'all 0.2s',
                                userSelect: 'none'
                              }}
                            >
                              {reg.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Deployment Environment Selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <ShieldCheck size={15} style={{ color: currentConfig.color }} />
                          Deployment Environment
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                          {[
                            { id: 'production', name: 'Production' },
                            { id: 'staging', name: 'Staging' },
                            { id: 'development', name: 'Development' }
                          ].map((envOption) => (
                            <div
                              key={envOption.id}
                              onClick={() => setSelectedEnvironment(envOption.id)}
                              style={{
                                background: selectedEnvironment === envOption.id ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                                border: selectedEnvironment === envOption.id ? `2px solid ${currentConfig.color}` : '1.5px solid var(--c2c-border)',
                                borderRadius: '10px',
                                padding: '0.65rem 0.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.82rem',
                                color: selectedEnvironment === envOption.id ? currentConfig.color : '#fff',
                                transition: 'all 0.2s',
                                userSelect: 'none'
                              }}
                            >
                              {envOption.name}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. Storage Sizing Option (Single-Component Repos) */}
                      {(!techStack?.components || techStack.components.length <= 1) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <label style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <HardDrive size={15} style={{ color: currentConfig.color }} />
                            Root SSD Storage Volume
                          </label>
                          <select
                            value={isCustomStorage ? 'custom' : storageSizeGb}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                setIsCustomStorage(true);
                              } else {
                                setIsCustomStorage(false);
                                setStorageSizeGb(Number(val));
                              }
                            }}
                            style={{ background: '#0f0f15', border: '1.5px solid var(--c2c-border)', borderRadius: '10px', color: '#fff', padding: '0.65rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value={10}>10 GB SSD (Lightweight / Frontend Only - ${ (10 * 0.08).toFixed(2) }/mo)</option>
                            <option value={20}>20 GB SSD (Standard Baseline - ${ (20 * 0.08).toFixed(2) }/mo)</option>
                            <option value={50}>50 GB SSD (Medium App - ${ (50 * 0.08).toFixed(2) }/mo)</option>
                            <option value={100}>100 GB SSD (High Capacity - ${ (100 * 0.08).toFixed(2) }/mo)</option>
                            <option value={200}>200 GB SSD (Heavy Workload - ${ (200 * 0.08).toFixed(2) }/mo)</option>
                            <option value="custom">⚙️ Custom Size (Define your own GB)...</option>
                          </select>

                          {isCustomStorage && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.8rem', borderRadius: '10px', border: '1px solid var(--c2c-border)' }}>
                              <span style={{ color: '#a2a2b5', fontSize: '0.8rem' }}>Custom Storage:</span>
                              <input
                                type="number"
                                min="10"
                                max="2000"
                                value={storageSizeGb}
                                onChange={(e) => {
                                  const num = Math.max(10, Math.min(2000, Number(e.target.value) || 10));
                                  setStorageSizeGb(num);
                                }}
                                style={{
                                  background: '#0f0f15',
                                  border: '1.5px solid var(--c2c-border)',
                                  borderRadius: '8px',
                                  color: '#fff',
                                  padding: '0.4rem 0.6rem',
                                  fontSize: '0.85rem',
                                  width: '80px',
                                  outline: 'none'
                                }}
                              />
                              <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>GB SSD</span>
                              <span style={{ color: '#10B981', fontSize: '0.8rem', marginLeft: 'auto', fontWeight: '600' }}>
                                +${(Number(storageSizeGb || 10) * 0.08).toFixed(2)}/mo
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--c2c-border)', borderRadius: '12px', padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>💾</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '600' }}>Per-Component Storage & Virtual RAM Active</span>
                            <span style={{ color: '#a2a2b5', fontSize: '0.75rem' }}>Root SSD storage sizes (10GB–200GB) and Linux swap memory (1GB–4GB) are tuned independently on each component card above.</span>
                          </div>
                        </div>
                      )}

                      {/* 5. Managed Database Add-On */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--c2c-border)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <label style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Database size={16} style={{ color: currentConfig.color }} />
                              Managed Database Add-On
                            </label>
                            <span style={{ color: '#a2a2b5', fontSize: '0.75rem' }}>
                              Provision high-availability {selectedCloud === 'AWS' ? 'Amazon RDS' : 'Google Cloud SQL'} instance
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            id="dbEnabledToggle"
                            checked={dbEnabled}
                            onChange={(e) => setDbEnabled(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: currentConfig.color }}
                          />
                        </div>

                        {dbEnabled && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
                            <label style={{ color: '#a2a2b5', fontSize: '0.8rem', fontWeight: '500' }}>Select Database Engine</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                              {[
                                { id: 'postgres', name: 'PostgreSQL 15', port: 'Port 5432' },
                                { id: 'mysql', name: 'MySQL 8.0', port: 'Port 3306' }
                              ].map((engine) => (
                                <div
                                  key={engine.id}
                                  onClick={() => setDbEngine(engine.id)}
                                  style={{
                                    background: dbEngine === engine.id ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                                    border: dbEngine === engine.id ? `2px solid ${currentConfig.color}` : '1.5px solid var(--c2c-border)',
                                    borderRadius: '10px',
                                    padding: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    userSelect: 'none'
                                  }}
                                >
                                  <div style={{ color: dbEngine === engine.id ? currentConfig.color : '#fff', fontWeight: '600', fontSize: '0.85rem' }}>{engine.name}</div>
                                  <div style={{ color: '#a2a2b5', fontSize: '0.75rem', marginTop: '0.15rem' }}>{engine.port} • ~$14.50/mo</div>
                                </div>
                              ))}
                            </div>
                            <span style={{ color: '#10B981', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                              ✨ DATABASE_URL and credentials will be auto-injected into your application container.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 6. Linux Swap Memory Option (Single-Component Repos) */}
                      {(!techStack?.components || techStack.components.length <= 1) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--c2c-border)', paddingTop: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <label style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Zap size={16} style={{ color: currentConfig.color }} />
                                Linux Swap Memory (Virtual RAM)
                              </label>
                              <span style={{ color: '#a2a2b5', fontSize: '0.75rem' }}>
                                Prevent Out-Of-Memory (OOM) crashes on burstable instances ($0 compute charge)
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              id="swapEnabledToggle"
                              checked={swapEnabled}
                              onChange={(e) => setSwapEnabled(e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: currentConfig.color }}
                            />
                          </div>

                          {swapEnabled && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.4rem' }}>
                              <label style={{ color: '#a2a2b5', fontSize: '0.8rem', fontWeight: '500' }}>Select Swap Allocation Size</label>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                {[
                                  { size: 1, label: '1 GB' },
                                  { size: 2, label: '2 GB (Default)' },
                                  { size: 3, label: '3 GB' },
                                  { size: 4, label: '4 GB' }
                                ].map((item) => (
                                  <div
                                    key={item.size}
                                    onClick={() => setSwapSizeGb(item.size)}
                                    style={{
                                      background: swapSizeGb === item.size ? 'var(--c2c-selected-bg)' : 'rgba(255, 255, 255, 0.02)',
                                      border: swapSizeGb === item.size ? `2px solid ${currentConfig.color}` : '1.5px solid var(--c2c-border)',
                                      borderRadius: '10px',
                                      padding: '0.6rem 0.4rem',
                                      textAlign: 'center',
                                      cursor: 'pointer',
                                      fontWeight: '600',
                                      fontSize: '0.78rem',
                                      color: swapSizeGb === item.size ? currentConfig.color : '#fff',
                                      transition: 'all 0.2s',
                                      userSelect: 'none'
                                    }}
                                  >
                                    {item.label}
                                  </div>
                                ))}
                              </div>
                              <span style={{ color: '#10B981', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                ✨ Allocates an optimized swapfile (`/swapfile`) with `swappiness=10` on the root disk during boot.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Application Environment Variables Section */}
              {selectedCloud && techStack && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: isEnvOpen ? `1.5px solid ${currentConfig.color}80` : '1.5px solid var(--c2c-border)',
                  borderRadius: '20px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'all 0.2s',
                  boxShadow: isEnvOpen ? `0 8px 32px -8px ${currentConfig.color}20` : 'none'
                }}>
                  <div 
                    onClick={() => setIsEnvOpen(!isEnvOpen)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--c2c-border)',
                        borderRadius: '12px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: currentConfig.color
                      }}>
                        <KeyRound size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>Application Environment Variables</h4>
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--c2c-border)',
                            borderRadius: '20px',
                            padding: '0.15rem 0.6rem',
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            color: '#a2a2b5'
                          }}>
                            {Object.values(envVars).reduce((sum, l) => sum + (Array.isArray(l) ? l.length : 0), 0)} Configured
                          </span>
                        </div>
                        <p style={{ color: '#a2a2b5', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>
                          Injected dynamically into your containers at launch. Secrets are encrypted via GitHub Actions & Terraform.
                        </p>
                      </div>
                    </div>
                    {isEnvOpen ? <ChevronUp size={18} style={{ color: '#a2a2b5' }} /> : <ChevronDown size={18} style={{ color: '#a2a2b5' }} />}
                  </div>

                  {isEnvOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.25rem' }}>
                      {(techStack?.components || [{ name: 'app' }]).map((comp) => {
                        const compName = comp.name.toLowerCase().replace('/', '-').replace('\\', '-');
                        const compEnvList = envVars[compName] || [];

                        return (
                          <div 
                            key={compName}
                            style={{
                              background: 'rgba(0, 0, 0, 0.25)',
                              border: '1px solid var(--c2c-border)',
                              borderRadius: '14px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.85rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: '700' }}>
                                  {comp.name || 'Application'}
                                </span>
                                {comp.type && (
                                  <span style={{ fontSize: '0.72rem', color: '#a2a2b5', background: 'rgba(255,255,255,0.04)', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>
                                    {comp.type}
                                  </span>
                                )}
                              </div>
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
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.borderColor = currentConfig.color; }}
                                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--c2c-border)'; }}
                                >
                                  <FileText size={13} />
                                  Paste .env
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddEnvVar(compName)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    background: `${currentConfig.color}15`,
                                    border: `1px solid ${currentConfig.color}50`,
                                    color: currentConfig.color,
                                    borderRadius: '8px',
                                    padding: '0.35rem 0.65rem',
                                    fontSize: '0.76rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = `${currentConfig.color}25`; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = `${currentConfig.color}15`; }}
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
                                No variables defined. Click <strong>"Add Variable"</strong> or <strong>"Paste .env"</strong> to add configuration.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {compEnvList.map((item, idx) => {
                                  const maskKey = `${compName}-${idx}`;
                                  const isRevealed = Boolean(showSecretMap[maskKey]);

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
                                      {/* Key */}
                                      <input
                                        type="text"
                                        placeholder="KEY_NAME"
                                        value={item.key}
                                        onChange={(e) => handleUpdateEnvVar(compName, idx, 'key', e.target.value)}
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

                                      {/* Value */}
                                      <input
                                        type={item.is_secret && !isRevealed ? 'password' : 'text'}
                                        placeholder="Value"
                                        value={item.value}
                                        onChange={(e) => handleUpdateEnvVar(compName, idx, 'value', e.target.value)}
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

                                      {/* Toggle Reveal for Secrets */}
                                      {item.is_secret ? (
                                        <button
                                          type="button"
                                          onClick={() => setShowSecretMap(prev => ({ ...prev, [maskKey]: !prev[maskKey] }))}
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

                                      {/* Secret / Public toggle */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateEnvVar(compName, idx, 'is_secret', !item.is_secret)}
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

                                      {/* Delete */}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteEnvVar(compName, idx)}
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
                  )}
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
                  zIndex: 9999,
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
                        <FileText size={20} style={{ color: currentConfig.color }} />
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
                        onClick={handleImportEnvPaste}
                        disabled={!envPasteText.trim()}
                        style={{
                          background: envPasteText.trim() ? currentConfig.color : 'rgba(255,255,255,0.05)',
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

              {/* Proceed CTA Button */}
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
                  padding: '1.2rem', borderRadius: '16px', fontWeight: '700', 
                  fontSize: '1rem',
                  cursor: (serviceId === 'docker' ? (!generating && !loadingStack) : (selectedCloud && !generating && !loadingStack))
                    ? 'pointer' 
                    : 'not-allowed',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', border: 'none',
                  boxShadow: (serviceId === 'docker' ? (!generating && !loadingStack) : (selectedCloud && !generating && !loadingStack))
                    ? `0 10px 25px -5px ${currentConfig.color}40`
                    : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {loadingStack ? 'Analyzing your tech stack...' : generating ? 'Generating your scripts...' : `${currentConfig.buttonText} →`}
              </button>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}

export default ServiceSetup;
