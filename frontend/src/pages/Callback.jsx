import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  const hasProcessedCode = useRef(false);

  useEffect(() => {
    // 1. Check for 'code' query param (GitHub OAuth redirect)
    const code = searchParams.get('code');
    if (code && !hasProcessedCode.current) {
      hasProcessedCode.current = true;
      exchangeCodeForToken(code);
      return;
    }

    // 2. Fallback check for 'data' query param (Backend custom redirect)
    const dataParam = searchParams.get('data');
    if (dataParam && !hasProcessedCode.current) {
      try {
        const decoded = JSON.parse(atob(dataParam));
        handleLoginData(decoded);
      } catch (err) {
        setError('Failed to parse authentication data from URL.');
      }
    }
  }, [searchParams]);

  const exchangeCodeForToken = async (code) => {
    setIsProcessingCode(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/github/callback?code=${code}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to exchange authorization code for token. Check CORS policy or backend logs.');
      }
      
      const payload = await response.json();
      handleLoginData(payload);
    } catch (err) {
      console.error('Error exchanging code:', err);
      setError('Could not automatically authenticate with GitHub. ' + err.message);
      setIsProcessingCode(false);
    }
  };

  const handleLoginData = (data) => {
    if (data && data.access_token && data.user) {
      login(data.user, data.access_token);
      navigate('/services', { replace: true });
    } else {
      setError('Invalid authentication data format received from server.');
      setIsProcessingCode(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonInput);
      handleLoginData(parsed);
    } catch (err) {
      setError('Invalid JSON format. Please paste the exact response.');
    }
  };

  return (
    <div className="login-container">
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      
      <div className="login-card" style={{ maxWidth: '600px' }}>
        <h2 className="login-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Authentication Callback</h2>
        
        {isProcessingCode ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '3rem 0' }}>
            <div className="loading-spinner" style={{ width: '40px', height: '40px', borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#5865F2', borderWidth: '3px', marginBottom: '1.5rem' }}></div>
            <p style={{ color: '#a2a2b5' }}>Authenticating with GitHub...</p>
          </div>
        ) : (
          <>
            <p className="login-subtitle" style={{ marginBottom: '1.5rem' }}>
              We couldn't automatically complete the login. If you have the JSON contents, paste them below:
            </p>
            
            <form onSubmit={handleManualSubmit}>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"access_token": "...", "user": {...}}'
                rows={8}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  resize: 'vertical'
                }}
              />
              {error && <p style={{color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.9rem'}}>{error}</p>}
              <button type="submit" className="github-btn">
                Complete Login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Callback;
