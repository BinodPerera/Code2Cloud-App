import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileCode, Folder, Download, Save, ArrowLeft, Check, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { apiClient } from '../utils/api';

function GenerationViewer() {
  const { generationId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [s3Url, setS3Url] = useState('');
  
  // Hot code map: { "Dockerfile": "...", "docker-compose.yml": "..." }
  const [codeMap, setCodeMap] = useState({});
  const [selectedFile, setSelectedFile] = useState('');
  const [activeTabs, setActiveTabs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Track changes locally to show "unsaved" status per file
  const [initialCodeMap, setInitialCodeMap] = useState({});

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
        setS3Url(data.s3_url || '');
        
        // Pick first file as active by default
        const files = Object.keys(data.generated_code || {});
        if (files.length > 0) {
          setSelectedFile(files[0]);
          setActiveTabs([files[0]]);
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

  // Construct line numbers array
  const currentCode = codeMap[selectedFile] || '';
  const lineCount = currentCode.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  // Group files into subfolders for a premium look
  const getFileGroups = () => {
    const groups = { root: [] };
    Object.keys(codeMap).forEach((path) => {
      if (path.includes('/')) {
        const parts = path.split('/');
        const folder = parts[0];
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(path);
      } else {
        groups.root.push(path);
      }
    });
    return groups;
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
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid rgba(255, 107, 107, 0.15)', borderRadius: '24px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '1rem' }} />
        <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Configuration Error</h3>
        <p style={{ color: '#a2a2b5', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => navigate('/services')} style={{ background: '#5865F2', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer' }}>
          Return to Setup
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/services')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#a2a2b5', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {projectName} 
              <span style={{ fontSize: '0.8rem', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                Hot/Cold Synced
              </span>
            </h2>
            <p style={{ color: '#a2a2b5', fontSize: '0.85rem', margin: 0 }}>Generation ID: {generationId}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: saveSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: saveSuccess ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
              color: saveSuccess ? '#10B981' : '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
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

          {s3Url && (
            <a
              href={s3Url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #00E5FF, #5865F2)',
                border: 'none',
                color: '#05050a',
                padding: '0.6rem 1.2rem',
                borderRadius: '12px',
                fontWeight: '700',
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(88, 101, 242, 0.25)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Download size={16} />
              Cold S3 Bundle (.zip)
            </a>
          )}
        </div>
      </div>

      {/* Editor Body Workspace */}
      <div style={{ display: 'flex', flexGrow: 1, background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
        
        {/* Left Sidebar File Explorer */}
        <div style={{ width: '260px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.15)', overflowY: 'auto' }}>
          <div>
            <span style={{ color: '#6e7191', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '1rem' }}>WORKSPACE FILES</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              {/* Nested Folders */}
              {Object.keys(fileGroups).map((folder) => {
                if (folder === 'root') return null;
                return (
                  <div key={folder}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a2a2b5', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', paddingLeft: '0.2rem' }}>
                      <Folder size={14} style={{ color: '#5865F2' }} />
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
                              background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
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
                            {isModified && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5FF' }}></span>}
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
                      background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
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
                    {isModified && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5FF' }}></span>}
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* Editor Screen & Tabs */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', background: '#08080c' }}>
          
          {/* Tab Bar */}
          <div style={{ display: 'flex', background: '#040407', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
            {activeTabs.map((tab) => {
              const isActive = selectedFile === tab;
              const isModified = codeMap[tab] !== initialCodeMap[tab];
              return (
                <div
                  key={tab}
                  onClick={() => setSelectedFile(tab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem 1.2rem',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    background: isActive ? '#08080c' : 'rgba(0,0,0,0.2)',
                    color: isActive ? '#fff' : '#6e7191',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                >
                  {isModified && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5FF' }}></span>}
                  <span>{tab}</span>
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
            <div style={{ display: 'flex', flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
              
              {/* Line Numbers column */}
              <div
                ref={lineNumbersRef}
                style={{
                  width: '45px',
                  padding: '1.2rem 0',
                  background: '#040407',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
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
      </div>
    </div>
  );
}

export default GenerationViewer;
