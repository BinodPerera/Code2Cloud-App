import { useState } from 'react';

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGithubLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/github/login', {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to initiate login');
      }

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = 'http://127.0.0.1:8000/api/v1/auth/github/login';
      }
    } catch (err) {
      console.error(err);
      window.location.href = 'http://127.0.0.1:8000/api/v1/auth/github/login';
    } finally {
      setTimeout(() => setIsLoading(false), 2000);
    }
  };

  return (
    <div className="login-container">
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>

      <div className="login-card">
        <div className="logo-wrapper">
          <div className="logo-icon">☁️</div>
        </div>

        <h1 className="login-title">Code2Cloud</h1>
        <p className="login-subtitle">Welcome back! Please login to your account.</p>

        <button
          className="github-btn"
          onClick={handleGithubLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              <svg className="github-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              Continue with GitHub
            </>
          )}
        </button>

        {errorMsg && <p style={{ color: '#ff6b6b', marginTop: '1rem', fontSize: '0.9rem' }}>{errorMsg}</p>}

        <div className="divider">
          <span>Secure</span>
        </div>

        <div className="login-footer">
          By logging in, you agree to our <br />
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}

export default Login;
