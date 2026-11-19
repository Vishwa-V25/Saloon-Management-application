import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('maison_aurum_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('maison_aurum_token'));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('maison_aurum_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password, portal) => {
    const res = await api.post('/auth/login', { email, password, portal });
    localStorage.setItem('maison_aurum_token', res.data.token);
    localStorage.setItem('maison_aurum_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await api.post('/api/auth/register'.replace('/api', ''), payload);
    localStorage.setItem('maison_aurum_token', res.data.token);
    localStorage.setItem('maison_aurum_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('maison_aurum_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    localStorage.removeItem('maison_aurum_token');
    localStorage.removeItem('maison_aurum_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
