import React, { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, ShieldCheck, Key, AlertCircle, FileText, CheckCircle, Clipboard, X } from 'lucide-react';
import { apiClient } from '../utils/api';

/**
 * Helper to parse .env file content client-side
 */
function parseEnvContent(text) {
  const result = [];
  const lines = text.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.substring(7).trim();
    if (line.includes('=')) {
      const idx = line.indexOf('=');
      const key = line.substring(0, idx).trim();
      let value = line.substring(idx + 1).trim();
      // Unquote if surrounded by quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      if (key) {
        result.push({ key, value });
      }
    }
  }
  return result;
}

export default function EnvVariablesEditor({ owner, repo, components, onSecretsSaved }) {
  // Map of componentName -> array of { key: string, value: string, isSecret: bool }
  const [envData, setEnvData] = useState({});
  const [existingSecrets, setExistingSecrets] = useState([]);
  const [loadingSecrets, setLoadingSecrets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Paste Modal state
  const [pasteModalComp, setPasteModalComp] = useState(null);
  const [rawPastedText, setRawPastedText] = useState('');

  // Fetch existing GitHub secret names on load
  useEffect(() => {
    async function fetchSecrets() {
      if (!owner || !repo) return;
      try {
        setLoadingSecrets(true);
        const res = await apiClient.get(`/repos/${owner}/${repo}/secrets-keys`);
        if (res.ok) {
          const data = await res.json();
          setExistingSecrets(data.secrets || []);
        }
      } catch (err) {
        console.error('Failed to fetch existing secret names:', err);
      } finally {
        setLoadingSecrets(false);
      }
    }
    fetchSecrets();
  }, [owner, repo]);

  // Initialize envData from components' pre-detected env_keys
  useEffect(() => {
    const initial = {};
    const compList = components && components.length > 0 ? components : [{ name: 'app', path: '.' }];
    
    compList.forEach(comp => {
      const compName = comp.name || 'app';
      const keys = comp.env_keys || [];
      initial[compName] = keys.map(k => ({
        key: k,
        value: '',
        isSecret: true
      }));
    });
    
    setEnvData(initial);
  }, [components]);

  const handleValueChange = (compName, index, field, val) => {
    setEnvData(prev => {
      const copy = { ...prev };
      const compRows = [...(copy[compName] || [])];
      compRows[index] = { ...compRows[index], [field]: val };
      copy[compName] = compRows;
      return copy;
    });
  };

  const handleAddVariable = (compName) => {
    setEnvData(prev => {
      const copy = { ...prev };
      const compRows = [...(copy[compName] || [])];
      compRows.push({ key: '', value: '', isSecret: true });
      copy[compName] = compRows;
      return copy;
    });
  };

  const handleDeleteVariable = (compName, index) => {
    setEnvData(prev => {
      const copy = { ...prev };
      const compRows = [...(copy[compName] || [])];
      compRows.splice(index, 1);
      copy[compName] = compRows;
      return copy;
    });
  };

  const applyParsedEntries = (compName, parsed) => {
    setEnvData(prev => {
      const copy = { ...prev };
      const existingRows = [...(copy[compName] || [])];
      
      parsed.forEach(item => {
        const foundIdx = existingRows.findIndex(r => r.key === item.key);
        if (foundIdx >= 0) {
          existingRows[foundIdx].value = item.value;
        } else {
          existingRows.push({ key: item.key, value: item.value, isSecret: true });
        }
      });
      
      copy[compName] = existingRows;
      return copy;
    });
  };

  const handleFileUpload = (compName, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const parsed = parseEnvContent(content);
      applyParsedEntries(compName, parsed);
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again if needed
    event.target.value = '';
  };

  const handleImportPastedContent = () => {
    if (!pasteModalComp || !rawPastedText.trim()) return;
    const parsed = parseEnvContent(rawPastedText);
    applyParsedEntries(pasteModalComp, parsed);
    setPasteModalComp(null);
    setRawPastedText('');
  };

  const handleSaveAndPush = async () => {
    setError('');
    setSaveSuccess(false);
    
    // Build payload of secrets to push
    const payload = {};
    const compKeys = Object.keys(envData);
    const isMultiComp = compKeys.length > 1;

    compKeys.forEach(compName => {
      const rows = envData[compName] || [];
      rows.forEach(r => {
        if (r.key && r.key.trim()) {
          let secretKeyName = r.key.trim().toUpperCase();
          if (isMultiComp && compName.toLowerCase() !== 'app') {
            const prefix = compName.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
            if (!secretKeyName.startsWith(prefix + '_')) {
              secretKeyName = `${prefix}_${secretKeyName}`;
            }
          }
          if (r.value !== undefined) {
            payload[secretKeyName] = r.value;
          }
        }
      });
    });

    if (Object.keys(payload).length === 0) {
      if (onSecretsSaved) onSecretsSaved({});
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.post(`/repos/${owner}/${repo}/push-custom-secrets`, payload);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to push secrets to GitHub Secrets');
      }
      
      setSaveSuccess(true);
      setExistingSecrets(prev => Array.from(new Set([...prev, ...Object.keys(payload)])));
      if (onSecretsSaved) onSecretsSaved(payload);
    } catch (err) {
      setError(err.message || 'An error occurred while pushing secrets.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#18181b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #27272a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color="#10B981" /> Environment Variables & Secrets
          </h3>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Upload a `.env` file, paste raw text, or enter variables manually. Values are encrypted into GitHub Secrets.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {saveSuccess && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', color: '#6ee7b7', padding: '12px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> Successfully updated & pushed environment secrets to GitHub Repository Secrets!
        </div>
      )}

      {Object.keys(envData).map(compName => {
        const rows = envData[compName] || [];
        return (
          <div key={compName} style={{ marginBottom: '1.5rem', backgroundColor: '#09090b', padding: '1.25rem', borderRadius: '8px', border: '1px solid #27272a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '0.95rem' }}>📁 {compName}</span>
                {rows.length > 0 && (
                  <span style={{ backgroundColor: '#27272a', color: '#a1a1aa', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px' }}>
                    {rows.length} {rows.length === 1 ? 'variable' : 'variables'}
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Paste Raw Content Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPasteModalComp(compName);
                    setRawPastedText('');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#27272a', color: '#e4e4e7', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', border: '1px solid #3f3f46', cursor: 'pointer' }}
                >
                  <Clipboard size={14} /> Paste Raw Text
                </button>

                {/* Upload File Button */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: '#27272a', color: '#e4e4e7', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', border: '1px solid #3f3f46' }}>
                  <Upload size={14} /> Upload File
                  <input
                    type="file"
                    accept="*/*"
                    onChange={(e) => handleFileUpload(compName, e)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {rows.length === 0 ? (
              <p style={{ color: '#71717a', fontSize: '0.85rem', fontStyle: 'italic', margin: '0 0 1rem 0' }}>
                No variables detected. Click "+ Add Variable", paste text, or upload a `.env` file for this component.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                {rows.map((row, idx) => {
                  const isAlreadySecret = existingSecrets.includes(row.key.toUpperCase());
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="KEY_NAME"
                        value={row.key}
                        onChange={(e) => handleValueChange(compName, idx, 'key', e.target.value)}
                        style={{ flex: '1', backgroundColor: '#18181b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                      />
                      <input
                        type="password"
                        placeholder="Value..."
                        value={row.value}
                        onChange={(e) => handleValueChange(compName, idx, 'value', e.target.value)}
                        style={{ flex: '1.5', backgroundColor: '#18181b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem' }}
                      />
                      {isAlreadySecret && (
                        <span title="Secret exists in GitHub Secrets" style={{ color: '#10B981', display: 'flex', alignItems: 'center' }}>
                          <ShieldCheck size={16} />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteVariable(compName, idx)}
                        style={{ backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', padding: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleAddVariable(compName)}
              style={{ backgroundColor: 'transparent', color: '#10B981', border: '1px dashed #10B981', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Add Variable
            </button>
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={handleSaveAndPush}
          disabled={saving}
          style={{ backgroundColor: '#10B981', color: '#000', fontWeight: '600', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}
        >
          <ShieldCheck size={18} /> {saving ? 'Pushing to GitHub Secrets...' : 'Save & Push Secrets to GitHub'}
        </button>
      </div>

      {/* Modal for Raw .env Copy-Paste */}
      {pasteModalComp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', width: '90%', maxWidth: '600px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clipboard size={18} color="#10B981" /> Paste Raw `.env` Text for <span style={{ color: '#10B981' }}>{pasteModalComp}</span>
              </h3>
              <button onClick={() => setPasteModalComp(null)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Paste your `.env` file contents below (`KEY=value`). Comments starting with `#` will be ignored automatically.
            </p>

            <textarea
              rows={10}
              placeholder={`PORT=3000\nDATABASE_URL=postgresql://user:pass@localhost:5432/dbname\nJWT_SECRET=supersecret`}
              value={rawPastedText}
              onChange={(e) => setRawPastedText(e.target.value)}
              style={{ width: '100%', backgroundColor: '#09090b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1.25rem', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPasteModalComp(null)}
                style={{ backgroundColor: '#27272a', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportPastedContent}
                disabled={!rawPastedText.trim()}
                style={{ backgroundColor: '#10B981', color: '#000', fontWeight: '600', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer', opacity: rawPastedText.trim() ? 1 : 0.5 }}
              >
                Parse & Import Variables
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
