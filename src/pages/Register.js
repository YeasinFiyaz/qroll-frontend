import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert, Spinner } from '../components/ui';
import { errorMessage } from '../api/axios';
import { useAuth } from '../auth';
import AuthLayout from './AuthLayout';
import { useFeatures } from '../features';

function Register() {
  const { register } = useAuth();
  const { isOn, loaded } = useFeatures();
  const location = useLocation();
  const teacherAllowed = isOn('global.registration_teacher');
  const signupOpen = isOn('global.registration');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'student' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      // Registration logs the user straight in; GuestOnly then redirects.
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
    } catch (err) {
      setError(errorMessage(err, 'Registration failed, please try again'));
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Create your account</h1>
      <p className="sub">It takes less than a minute.</p>
      <Alert>{error}</Alert>
      {loaded && !signupOpen && <Alert type="warning">Sign-up is currently closed. Please contact your administrator for an account.</Alert>}

      <form onSubmit={handleRegister} style={loaded && !signupOpen ? { opacity: .5, pointerEvents: 'none' } : undefined}>
        <div className="field">
          <label>I am a</label>
          <div className="role-pick">
            {[
              { v: 'student', icon: 'cap', t: 'Student', d: 'Scan QR to mark attendance' },
              ...(teacherAllowed ? [{ v: 'teacher', icon: 'users', t: 'Teacher', d: 'Create courses & sessions' }] : []),
            ].map((r) => (
              <button
                type="button" key={r.v} className={`role-opt${form.role === r.v ? ' on' : ''}`}
                onClick={() => setForm({ ...form, role: r.v })}
              >
                <span className="ri"><Icon name={r.icon} /></span>
                <b>{r.t}</b>
                <span>{r.d}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <div className="input-wrap">
            <Icon name="user" />
            <input id="name" className="input" placeholder="e.g. Rahim Uddin" value={form.name} onChange={set('name')} required autoComplete="name" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap">
            <Icon name="at" />
            <input id="email" className="input" type="email" placeholder="you@university.edu" value={form.email} onChange={set('email')} required autoComplete="email" />
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" className="input" type="password" placeholder="6+ characters" value={form.password} onChange={set('password')} required autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm</label>
            <input id="confirm" className="input" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required autoComplete="new-password" />
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-block mt-1" type="submit" disabled={busy}>
          {busy ? <><Spinner /> Creating account…</> : <>Create account <Icon name="arrowRight" /></>}
        </button>
      </form>

      <p className="switch">
        Already have an account? <Link to={`/login${location.search}`}>Log in</Link>
      </p>
    </AuthLayout>
  );
}

export default Register;
