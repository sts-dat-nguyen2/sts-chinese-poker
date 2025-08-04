// hooks/useSession.ts
import { useState, useEffect } from 'react';
import { Session, SessionAuth, CreateSessionData, LoginData } from '../types';
import { sessionApi, gameApi, ApiError } from '../services/apiService';

export const useSession = () => {
  const [sessionAuth, setSessionAuth] = useState<SessionAuth>({
    isAuthenticated: false,
    isCreator: false,
    session: null,
    sessionCode: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize session from URL
  useEffect(() => {
    const urlPath = window.location.pathname;
    const sessionMatch = urlPath.match(/\/session\/([a-f0-9]+)/);
    
    if (sessionMatch) {
      const sessionCode = sessionMatch[1];
      loadSession(sessionCode);
    }
  }, []);

  const clearError = () => setError(null);

  const loadSession = async (sessionCode: string) => {
    setIsLoading(true);
    clearError();
    
    try {
      const session = await sessionApi.getSession(sessionCode);
      setSessionAuth({
        isAuthenticated: false,
        isCreator: false,
        session,
        sessionCode,
      });
      
      // Update URL without triggering a page reload
      window.history.pushState({}, '', `/session/${sessionCode}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load session');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (sessionData: CreateSessionData) => {
    setIsLoading(true);
    clearError();
    
    try {
      const response = await sessionApi.createSession(sessionData);
      const { session } = response;
      
      setSessionAuth({
        isAuthenticated: true,
        isCreator: true,
        session,
        sessionCode: session.session_code,
      });
      
      // Update URL to the new session
      window.history.pushState({}, '', `/session/${session.session_code}`);
      
      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create session');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateCreator = async (loginData: LoginData) => {
    if (!sessionAuth.sessionCode) {
      setError('No session loaded');
      return;
    }

    setIsLoading(true);
    clearError();
    
    try {
      const response = await sessionApi.authenticateCreator(sessionAuth.sessionCode, loginData);
      
      setSessionAuth(prev => ({
        ...prev,
        isAuthenticated: true,
        isCreator: true,
      }));
      
      return response;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Authentication failed');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const viewAsGuest = () => {
    setSessionAuth(prev => ({
      ...prev,
      isAuthenticated: true,
      isCreator: false,
    }));
  };

  const resetSessionData = async (creatorName: string, creatorPassword: string) => {
    if (!sessionAuth.sessionCode) {
      setError('No session loaded');
      return;
    }

    setIsLoading(true);
    clearError();
    
    try {
      await sessionApi.resetSessionData(sessionAuth.sessionCode, creatorName, creatorPassword);
      return true;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to reset session data');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setSessionAuth({
      isAuthenticated: false,
      isCreator: false,
      session: null,
      sessionCode: null,
    });
    window.history.pushState({}, '', '/');
  };

  return {
    sessionAuth,
    isLoading,
    error,
    clearError,
    loadSession,
    createSession,
    authenticateCreator,
    viewAsGuest,
    resetSessionData,
    logout,
  };
};