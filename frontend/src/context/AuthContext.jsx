import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, decodeToken } from '../utils/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('code2cloud_user');
    localStorage.removeItem('code2cloud_token');
    clearLogoutTimer();
    console.log('User logged out');
  }, [clearLogoutTimer]);

  const setLogoutTimer = useCallback((expirationTime) => {
    clearLogoutTimer();
    const currentTime = Date.now();
    const delay = expirationTime * 1000 - currentTime;

    if (delay > 0) {
      console.log(`Setting auto-logout timer for ${Math.round(delay / 60000)} minutes`);
      logoutTimerRef.current = setTimeout(() => {
        console.warn('Token expired, logging out automatically');
        logout();
      }, delay);
    } else {
      console.warn('Token already expired, logging out immediately');
      logout();
    }
  }, [clearLogoutTimer, logout]);

  useEffect(() => {
    // Register global logout handler with API client
    apiClient.setLogoutHandler(logout);

    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('code2cloud_user');
        const storedToken = localStorage.getItem('code2cloud_token');
        
        if (storedUser && storedToken) {
          const decoded = decodeToken(storedToken);
          if (decoded && decoded.exp) {
            // Check if token is already expired
            if (decoded.exp * 1000 < Date.now()) {
              console.warn('Persisted token is expired');
              logout();
            } else {
              setUser(JSON.parse(storedUser));
              setToken(storedToken);
              setLogoutTimer(decoded.exp);
            }
          } else {
            // Not a JWT or no exp claim, but we have auth data
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
          }
        }
      } catch (error) {
        console.error('Failed to parse auth data from local storage', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => clearLogoutTimer();
  }, [logout, setLogoutTimer, clearLogoutTimer]);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('code2cloud_user', JSON.stringify(userData));
    localStorage.setItem('code2cloud_token', accessToken);
    
    // Set timer if it's a JWT
    const decoded = decodeToken(accessToken);
    if (decoded && decoded.exp) {
      setLogoutTimer(decoded.exp);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
