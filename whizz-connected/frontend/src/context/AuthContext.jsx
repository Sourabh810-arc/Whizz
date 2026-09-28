import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('whizz_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('whizz_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
          localStorage.setItem('whizz_user', JSON.stringify(data.user));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persistAuth(data);
    return data;
  };

  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    persistAuth(data);
    return data;
  };

  const persistAuth = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('whizz_token', data.token);
    localStorage.setItem('whizz_user', JSON.stringify(data.user));
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('whizz_token');
    localStorage.removeItem('whizz_user');
  }, []);

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('whizz_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
