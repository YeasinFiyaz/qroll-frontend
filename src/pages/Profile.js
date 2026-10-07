import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert, Spinner, initials, useToast } from '../components/ui';
import API, { errorMessage } from '../api/axios';
import { useAuth } from '../auth';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (form.next.length < 6) return setError('New password must be at least 6 characters');
    if (form.next !== form.confirm) return setError('New passwords do not match');
    setBusy(true);
    try {
      await API.put('/auth/password', { current_password: form.current, new_password: form.next });
      toast('Password updated');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">Account</div>
          <h1>Profile</h1>
        </div>
      </div>

      <div className="card mb-2" style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <span className="avatar lg">{initials(user?.name)}</span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h2 style={{ fontSize: 22 }}>{user?.name}</h2>
          <p className="muted">{user?.email}</p>
          <span className="badge brand mt-1" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
        </div>
        <button className="btn btn-danger-soft" onClick={() => { logout(); navigate('/login'); }}>
          <Icon name="logout" /> Log out
        </button>
      </div>

      <div className="card">
        <div className="card-head"><h3><Icon name="lock" /> Change password</h3></div>
        <form onSubmit={changePassword}>
          <Alert>{error}</Alert>
          <div className="field">
            <label>Current password</label>
            <input className="input" type="password" value={form.current} onChange={set('current')} required autoComplete="current-password" />
          </div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="field">
              <label>New password</label>
              <input className="input" type="password" value={form.next} onChange={set('next')} required autoComplete="new-password" />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input className="input" type="password" value={form.confirm} onChange={set('confirm')} required autoComplete="new-password" />
            </div>
          </div>
          <button className="btn btn-primary" disabled={busy}>{busy && <Spinner />} Update password</button>
        </form>
      </div>
    </main>
  );
}

export default Profile;
