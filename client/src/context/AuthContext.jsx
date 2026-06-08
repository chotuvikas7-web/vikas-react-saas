import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('ve_user') || 'null'));

  const login = async (type, payload) => {
    const path = type === 'super-admin' ? '/auth/super-admin/login' : '/auth/admin/login';
    const data = await api(path, { method: 'POST', body: JSON.stringify(payload) });
    localStorage.setItem('ve_token', data.token);
    localStorage.setItem('ve_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('ve_token');
    localStorage.removeItem('ve_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
