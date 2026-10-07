import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert, Spinner } from '../components/ui';
import API, { errorMessage } from '../api/axios';
import AuthLayout from './AuthLayout';

function Forgot() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await API.post('/auth/forgot', { email: email.trim() });
      setSent(res.data.message);
    } catch (err) {
      setError(errorMessage(err, 'Could not send the reset email'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Forgot your password?</h1>
      <p className="sub">Enter your email and we’ll send you a link to choose a new one.</p>
      <Alert>{error}</Alert>
      {sent ? (
        <>
          <Alert type="success">{sent}</Alert>
          <p className="small text-2">The link is valid for 30 minutes. Didn’t get it? Check your spam folder, or <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSent('')}>try again</button>.</p>
        </>
      ) : (
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <Icon name="at" />
              <input id="email" className="input" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" />
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-block mt-1" type="submit" disabled={busy}>
            {busy ? <><Spinner /> Sending…</> : <><Icon name="mail" /> Send reset link</>}
          </button>
        </form>
      )}
      <p className="switch">
        <Link to="/login"><Icon name="arrowLeft" size={14} /> Back to log in</Link>
      </p>
    </AuthLayout>
  );
}

export default Forgot;
