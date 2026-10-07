import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert, Spinner } from '../components/ui';
import { errorMessage } from '../api/axios';
import { useAuth } from '../auth';
import AuthLayout from './AuthLayout';

function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next') || '';
  const fromScan = next.startsWith('/scan');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      // On success the auth context updates and GuestOnly redirects (to `next` if present).
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err, 'Login failed, please try again'));
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Welcome back 👋</h1>
      <p className="sub">Log in to your QRoll account.</p>

      {fromScan && <Alert type="info">Log in to mark your attendance — you’ll be checked in right after.</Alert>}
      <Alert>{error}</Alert>

      <form onSubmit={handleLogin}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap">
            <Icon name="at" />
            <input
              id="email" className="input" type="email" placeholder="you@university.edu"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoFocus
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <Icon name="lock" />
            <input
              id="password" className="input" type={show ? 'text' : 'password'} placeholder="Your password"
              value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
            />
            <button type="button" className="icon-btn trail" style={{ border: 0, background: 'none' }}
              onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
              <Icon name={show ? 'eyeOff' : 'eye'} />
            </button>
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-block mt-1" type="submit" disabled={busy}>
          {busy ? <><Spinner /> Logging in…</> : <>Log in <Icon name="arrowRight" /></>}
        </button>
        <p className="small" style={{ textAlign: 'right', marginTop: 10 }}>
          <Link to="/forgot">Forgot password?</Link>
        </p>
      </form>

      <p className="switch">
        New to QRoll? <Link to={`/register${location.search}`}>Create an account</Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
