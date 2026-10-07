import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import {
  Alert, ConfirmModal, Empty, Loading, Modal, Spinner, useFetch, useToast, fmtDate, downloadCSV,
} from '../components/ui';
import API, { errorMessage } from '../api/axios';
import { useAuth } from '../auth';

const ROLE_TONE = { admin: 'danger', teacher: 'brand', student: 'success' };
const ROLES = ['student', 'teacher', 'admin'];

function UserModal({ user, onClose, onSaved }) {
  const editing = !!user;
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', role: user?.role || 'student', password: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = { name: form.name.trim(), email: form.email.trim(), role: form.role };
      if (form.password) body.password = form.password;
      const res = editing
        ? await API.put(`/admin/users/${user.user_id}`, body)
        : await API.post('/admin/users', { ...body, password: form.password });
      onSaved(res.data.message || (editing ? 'User updated' : 'User created'));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? `Edit ${user.name}` : 'Create account'} onClose={onClose}>
      <form onSubmit={submit}>
        <Alert>{error}</Alert>
        <div className="field">
          <label>Role</label>
          <div className="segmented">
            {ROLES.map((r) => (
              <button type="button" key={r} className={form.role === r ? 'on' : ''} onClick={() => setForm({ ...form, role: r })}>
                <Icon name={r === 'admin' ? 'shield' : r === 'teacher' ? 'users' : 'cap'} size={15} /> {r}
              </button>
            ))}
          </div>
        </div>
        <div className="field"><label>Full name</label><input className="input" value={form.name} onChange={set('name')} required autoFocus /></div>
        <div className="field"><label>Email</label><input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
        <div className="field">
          <label>{editing ? 'New password (leave blank to keep)' : 'Password'}</label>
          <input className="input" type="text" autoComplete="off" value={form.password} onChange={set('password')} required={!editing} placeholder="At least 6 characters" />
          {!editing && <span className="hint">Share this password with the person; they can change it from their profile.</span>}
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? <Spinner /> : <Icon name="check" />} {editing ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Modal>
  );
}

function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [role, setRole] = useState(params.get('role') || '');
  const [modal, setModal] = useState(null); // 'create' | user object
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const { data: users, loading, error, reload } = useFetch(
    () => API.get('/admin/users').then((r) => r.data), []
  );

  useEffect(() => {
    const next = {};
    if (q) next.q = q;
    if (role) next.role = role;
    setParams(next, { replace: true });
  }, [q, role, setParams]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (users || []).filter((u) => (!role || u.role === role) && (!needle || `${u.name} ${u.email}`.toLowerCase().includes(needle)));
  }, [users, q, role]);

  const counts = useMemo(() => (users || []).reduce((a, u) => ({ ...a, [u.role]: (a[u.role] || 0) + 1 }), {}), [users]);

  const selectable = rows.filter((u) => u.user_id !== me.id);
  const allSelected = selectable.length > 0 && selectable.every((u) => selected.has(u.user_id));
  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectable.map((u) => u.user_id)));

  const bulkRemove = async () => {
    setBusy(true);
    try {
      const res = await API.post('/admin/users/bulk-delete', { ids: [...selected] });
      toast(res.data.message);
      setSelected(new Set());
      setBulkConfirm(false);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await API.delete(`/admin/users/${removing.user_id}`);
      toast(res.data.message);
      setRemoving(null);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>Users</h1>
          <p>Every account on QRoll. Create, edit, change roles, reset passwords or delete.</p>
        </div>
        <div className="row wrap">
          {users?.length > 0 && (
            <button className="btn btn-secondary" onClick={() => downloadCSV('qroll_users.csv', ['Name', 'Email', 'Role', 'Joined'], users.map((u) => [u.name, u.email, u.role, fmtDate(u.created_at)]))}>
              <Icon name="download" /> CSV
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setModal('create')}><Icon name="plus" /> New account</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="alert alert-warning" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span><b>{selected.size}</b> user{selected.size === 1 ? '' : 's'} selected</span>
          <span className="row">
            <button className="btn btn-sm btn-secondary" onClick={() => setSelected(new Set())}>Clear</button>
            <button className="btn btn-sm btn-danger" onClick={() => setBulkConfirm(true)}><Icon name="trash" size={14} /> Delete selected</button>
          </span>
        </div>
      )}

      <div className="card mb-2">
        <div className="row wrap">
          <div className="input-wrap" style={{ flex: '1 1 240px' }}>
            <Icon name="search" />
            <input className="input" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="chips">
            <button className={`chip${!role ? ' on' : ''}`} onClick={() => setRole('')}>All ({users?.length || 0})</button>
            {ROLES.map((r) => (
              <button key={r} className={`chip${role === r ? ' on' : ''}`} onClick={() => setRole(r)}>{r}s ({counts[r] || 0})</button>
            ))}
          </div>
        </div>
      </div>

      {loading && <Loading />}
      {error && <Alert>{errorMessage(error)} <button className="btn btn-sm btn-secondary" onClick={reload}>Retry</button></Alert>}

      {users && (
        <div className="card flush">
          {rows.length === 0 ? (
            <Empty icon="users" title="No matching users" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr>
                  <th style={{ width: 36 }}><input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} /></th>
                  <th>User</th><th>Role</th><th>Activity</th><th>Joined</th><th />
                </tr></thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.user_id} className={selected.has(u.user_id) ? 'selected' : undefined}>
                      <td>{u.user_id !== me.id && <input type="checkbox" aria-label={`Select ${u.name}`} checked={selected.has(u.user_id)} onChange={() => toggle(u.user_id)} />}</td>
                      <td><div className="bold">{u.name}{u.user_id === me.id && <span className="muted xs"> (you)</span>}</div><div className="muted xs">{u.email}</div></td>
                      <td><span className={`badge ${ROLE_TONE[u.role]}`}>{u.role}</span></td>
                      <td className="small muted nowrap">
                        {u.role === 'student'
                          ? `${u.enrolled_count} courses · ${u.attendance_count} check-ins`
                          : u.role === 'teacher' ? `${u.course_count} courses` : '—'}
                      </td>
                      <td className="small muted nowrap">{fmtDate(u.created_at)}</td>
                      <td className="num nowrap">
                        <button className="icon-btn" title="Edit" onClick={() => setModal(u)}><Icon name="edit" size={15} /></button>{' '}
                        {u.user_id !== me.id && (
                          <button className="icon-btn danger" title="Delete" onClick={() => setRemoving(u)}><Icon name="trash" size={15} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={(msg) => { setModal(null); toast(msg); reload(); }}
        />
      )}
      {bulkConfirm && (
        <ConfirmModal
          title={`Delete ${selected.size} selected user${selected.size === 1 ? '' : 's'}?`}
          text="Each selected account is removed together with everything it owns: a teacher's courses, sessions and attendance records, or a student's enrollments and check-ins. This cannot be undone."
          confirmLabel={`Delete ${selected.size}`} danger busy={busy}
          onConfirm={bulkRemove} onClose={() => setBulkConfirm(false)}
        />
      )}
      {removing && (
        <ConfirmModal
          title={`Delete ${removing.name}?`}
          text={removing.role === 'teacher'
            ? `This deletes the teacher together with their ${removing.course_count} course(s), all sessions and attendance records. This cannot be undone.`
            : removing.role === 'student'
              ? 'This deletes the student and all of their attendance records. This cannot be undone.'
              : 'This deletes the admin account. This cannot be undone.'}
          confirmLabel="Delete" danger busy={busy}
          onConfirm={remove} onClose={() => setRemoving(null)}
        />
      )}
    </main>
  );
}

export default AdminUsers;
