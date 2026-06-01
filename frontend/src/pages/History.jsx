import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { History, Eye, Download, CheckCircle, HelpCircle, ExternalLink, Calendar, Layers, Cpu, Server, Play, RefreshCw } from 'lucide-react';
import { apiClient } from '../utils/api';

function HistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await apiClient.get('/repos/generations/history');
        if (!res.ok) {
          throw new Error('Failed to load history list.');
        }
        const data = await res.json();
        setHistoryList(data || []);
      } catch (err) {
        if (err.message !== 'Unauthorized') {
          setError('Could not retrieve your deployment history. Please try again later.');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  const [downloadingMap, setDownloadingMap] = useState({});

  const handleDownload = async (generationId, projectName) => {
    try {
      setDownloadingMap((prev) => ({ ...prev, [generationId]: true }));
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
      setDownloadingMap((prev) => ({ ...prev, [generationId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div className="loading-spinner" style={{ width: '48px', height: '48px' }}></div>
        <p style={{ color: '#a2a2b5', fontSize: '1.1rem' }}>Loading your deployment ledger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', background: 'rgba(255, 107, 107, 0.05)', border: '1px solid rgba(255, 107, 107, 0.15)', borderRadius: '24px' }}>
        <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>History Error</h3>
        <p style={{ color: '#a2a2b5', marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={() => navigate('/services')} style={{ background: '#5865F2', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer' }}>
          Back to Setup
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <History size={32} style={{ color: '#00E5FF' }} />
            Deployment History
          </h2>
          <p style={{ color: '#a2a2b5', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
            Browse and manage your generated container infrastructures and direct SCM commits.
          </p>
        </div>
      </div>

      {historyList.length === 0 ? (
        // Premium Empty State
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '24px',
          padding: '4rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 229, 255, 0.15)' }}>
            <History size={40} style={{ color: '#00E5FF' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', margin: '0 0 0.5rem 0' }}>No History Recorded</h3>
            <p style={{ color: '#a2a2b5', fontSize: '0.95rem', maxWidth: '480px', margin: 0, lineHeight: '1.5' }}>
              You haven't generated any deployment assets yet. Build your first container setup or cloud stack configurations to see them here!
            </p>
          </div>
          <button
            onClick={() => navigate('/services')}
            style={{
              background: 'linear-gradient(135deg, #00E5FF, #5865F2)',
              color: '#05050a',
              border: 'none',
              padding: '0.8rem 1.6rem',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(88, 101, 242, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Play size={16} fill="currentColor" />
            Build Deployment Setup
          </button>
        </div>
      ) : (
        // Grid of Generation History Cards
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
          {historyList.map((item) => {
            const isCommitted = item.committed === true;
            return (
              <div
                key={item.generation_id}
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '24px',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.2rem',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.25)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 229, 255, 0.04)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.project_name}
                    </h4>
                    <a
                      href={item.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#6e7191', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem', textDecoration: 'none' }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#00E5FF'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#6e7191'}
                    >
                      GitHub Repo <ExternalLink size={10} />
                    </a>
                  </div>

                  {/* Service ID Badge */}
                  <span style={{
                    fontSize: '0.75rem',
                    background: item.service_id === 'docker' ? 'rgba(0, 229, 255, 0.1)' : 'rgba(88, 101, 242, 0.1)',
                    color: item.service_id === 'docker' ? '#00E5FF' : '#a3b3ff',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    border: item.service_id === 'docker' ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid rgba(88, 101, 242, 0.2)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {item.service_id}
                  </span>
                </div>

                {/* Middleware Specs / Tech & Cloud Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.03)' }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a2a2b5', fontSize: '0.85rem' }}>
                    <Server size={14} style={{ color: '#5865F2' }} />
                    <span>Cloud: <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{item.cloud || 'agnostic'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#a2a2b5', fontSize: '0.85rem' }}>
                    <Layers size={14} style={{ color: '#5865F2', marginTop: '0.15rem' }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                      <span>Stack:</span>
                      {item.detected_tech && item.detected_tech.length > 0 ? (
                        item.detected_tech.map((tech, idx) => (
                          <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: '#fff' }}>Generic</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* SCM Commit and Date Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem', marginTop: '0.2rem' }}>

                  {/* Calendar Creation Date */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6e7191', fontSize: '0.8rem' }}>
                    <Calendar size={13} />
                    {formatDate(item.timestamp)}
                  </span>

                  {/* Commitment Badge */}
                  {isCommitted ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle size={12} fill="currentColor" style={{ color: '#040407' }} />
                      Committed
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(245,158,11,0.08)', color: '#F59E0B', padding: '0.25rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid rgba(245,158,11,0.15)' }}>
                      <HelpCircle size={12} />
                      Uncommitted
                    </span>
                  )}

                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem' }}>

                  {/* View/Edit Configs */}
                  <button
                    onClick={() => navigate(`/generation/${item.generation_id}`)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                      padding: '0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <Eye size={14} />
                    View & Edit
                  </button>

                  {/* Cloudinary Download direct link */}
                  {item.url && (
                    <button
                      onClick={() => handleDownload(item.generation_id, item.project_name)}
                      disabled={downloadingMap[item.generation_id]}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '42px',
                        height: '38px',
                        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(88, 101, 242, 0.15))',
                        border: '1px solid rgba(88, 101, 242, 0.3)',
                        borderRadius: '12px',
                        color: '#00E5FF',
                        cursor: downloadingMap[item.generation_id] ? 'not-allowed' : 'pointer',
                        transition: 'transform 0.2s',
                        opacity: downloadingMap[item.generation_id] ? 0.7 : 1
                      }}
                      onMouseOver={(e) => { !downloadingMap[item.generation_id] && (e.currentTarget.style.transform = 'scale(1.05)'); !downloadingMap[item.generation_id] && (e.currentTarget.style.borderColor = '#00E5FF'); }}
                      onMouseOut={(e) => { !downloadingMap[item.generation_id] && (e.currentTarget.style.transform = 'scale(1)'); !downloadingMap[item.generation_id] && (e.currentTarget.style.borderColor = 'rgba(88, 101, 242, 0.3)'); }}
                      title="Download ZIP package"
                    >
                      {downloadingMap[item.generation_id] ? (
                        <RefreshCw size={15} className="loading-spinner" />
                      ) : (
                        <Download size={15} />
                      )}
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
