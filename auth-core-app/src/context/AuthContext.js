import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthAPI } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLicence, setUserLicence] = useState(null);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const session = await AuthAPI.checkSession();
      if (session.active) {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.log('Bootstrap Error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (licenceKey) => {
    const result = await AuthAPI.login(licenceKey);
    if (result.status && result.allowed) {
      setIsAuthenticated(true);
      setUserLicence(licenceKey);
      return { success: true };
    }
    return { success: false, message: result.message };
  };

  const logout = async () => {
    await AuthAPI.logout();
    setIsAuthenticated(false);
    setUserLicence(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, userLicence }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
