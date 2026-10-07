import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert, Spinner } from '../components/ui';
import API, { errorMessage } from '../api/axios';
import { useAuth } from '../auth';
import AuthLayout from './AuthLayout';

function Reset() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { applySession } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      const res = await API.post('/auth/reset', { token, password });
      // Logs the user straight in; GuestOnly then redirects to their home page.
      applySession(res.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not reset the password'));
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Choose a new password</h1>
      <p className="sub">You’ll be logged in right after.</p>
      {!token && <Alert>This reset link is missing its token. Open the link from your email again, or <Link to="/forgot">request a new one</Link>.</Alert>}
      <Alert>{error}</Alert>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="password">New password</label>
          <div className="input-wrap">
            <Icon name="lock" />
            <input id="password" className="input" type={show ? 'text' : 'password'} placeholder="6+ characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus autoComplete="new-password" />
            <button type="button" className="icon-btn trail" style={{ border: 0, background: 'none' }} onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
              <Icon name={show ? 'eyeOff' : 'eye'} />
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm new password</label>
          <div className="input-wrap">
            <Icon name="lock" />
            <input id="confirm" className="input" type={show ? 'text' : 'password'} placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-block mt-1" type="submit" disabled={busy || !token}>
          {busy ? <><Spinner /> Saving…</> : <><Icon name="check" /> Set new password</>}
        </button>
      </form>
      <p className="switch">
        <Link to="/login"><Icon name="arrowLeft" size={14} /> Back to log in</Link>
      </p>
    </AuthLayout>
  );
}

export default Reset;
