import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('gigshield_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setToken(parsed.token);
        setUser(parsed.user);
        setRole(parsed.role);
      } catch { localStorage.removeItem('gigshield_auth'); }
    }
    setLoading(false);
  }, []);

  const login = useCallback((tokenVal, userVal, roleVal) => {
    const data = { token: tokenVal, user: userVal, role: roleVal };
    localStorage.setItem('gigshield_auth', JSON.stringify(data));
    setToken(tokenVal);
    setUser(userVal);
    setRole(roleVal);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gigshield_auth');
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
