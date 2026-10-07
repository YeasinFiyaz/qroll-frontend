import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API, { onUnauthorized } from './api/axios';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) return JSON.parse(raw);
    // Older versions stored the fields separately.
    const role = localStorage.getItem('role');
    if (role) {
      return {
        id: Number(localStorage.getItem('user_id')) || null,
        name: localStorage.getItem('name') || '',
        role,
      };
    }
  } catch (e) { /* ignore corrupt storage */ }
  return null;
}

function persist(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  // Keep the legacy keys in sync for anything still reading them.
  localStorage.setItem('role', user.role);
  localStorage.setItem('name', user.name);
  localStorage.setItem('user_id', String(user.id));
}

export function homeFor(user) {
  if (!user) return '/login';
  return user.role === 'student' ? '/student' : '/dashboard';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => (localStorage.getItem('token') ? readStoredUser() : null));

  const logout = useCallback(() => {
    ['token', 'user', 'role', 'name', 'user_id'].forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setUser(null);
  }, []);

  const applySession = useCallback((data) => {
    persist(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    return applySession(res.data);
  }, [applySession]);

  const register = useCallback(async (form) => {
    const res = await API.post('/auth/register', form);
    if (res.data.token) return applySession(res.data);
    return login(form.email, form.password);
  }, [applySession, login]);

  // Refresh the profile in the background; drop the session if the token is dead.
  useEffect(() => {
    if (!token) return;
    API.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      })
      .catch((err) => { if (err.response?.status === 401) logout(); });
  }, [token, logout]);

  useEffect(() => onUnauthorized(logout), [logout]);

  const value = useMemo(
    () => ({ token, user, isTeacher: user && user.role !== 'student', login, register, logout }),
    [token, user, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
