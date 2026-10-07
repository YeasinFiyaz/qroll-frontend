import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { Stat, Loading, Alert, Progress, useFetch, greeting, firstName, timeAgo, fmtDateTime } from '../components/ui';
import API, { errorMessage } from '../api/axios';
import { useAuth } from '../auth';

const ROLE_TONE = { admin: 'danger', teacher: 'brand', student: 'success' };

function AdminDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(
    () => API.get('/admin/overview', { params: { tz: -new Date().getTimezoneOffset() } }).then((r) => r.data), []
  );

  return (
    <main className="page">
      <section className="hero hero-admin">
        <div className="row wrap" style={{ justifyContent: 'space-between', gap: 18 }}>
          <div>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,.8)' }}><Icon name="shield" size={13} /> Administrator</div>
            <h1>{greeting()}, {firstName(user?.name)} 👋</h1>
            <p>You have full control: manage every user and course, and switch any part of the app on or off.</p>
          </div>
          <div className="row wrap">
            <Link to="/admin/users" className="btn btn-white"><Icon name="users" /> Manage users</Link>
            <Link to="/admin/settings" className="btn btn-white"><Icon name="edit" /> Feature switches</Link>
          </div>
        </div>
      </section>

      {loading && <Loading label="Loading site overview…" />}
      {error && <Alert>{errorMessage(error)} <button className="btn btn-sm btn-secondary" onClick={reload}>Retry</button></Alert>}

      {data && (
        <>
          <div className="stats stats-4">
            <Stat icon="cap" tone="success" value={data.students} label="Students" />
            <Stat icon="users" tone="brand" value={data.teachers} label="Teachers" />
            <Stat icon="shield" tone="danger" value={data.admins} label="Admins" />
            <Stat icon="book" tone="info" value={data.courses} label="Courses" />
            <Stat icon="qr" tone="warning" value={data.sessions} label="Sessions" />
            <Stat icon="zap" tone="success" value={data.live_sessions} label="Live right now" />
            <Stat icon="checkCircle" tone="info" value={data.attendances} label="Total check-ins" />
            <Stat icon="clock" tone="brand" value={data.scans_today} label="Check-ins today" />
          </div>

          <div className="grid grid-main">
            <div className="card flush">
              <div className="card-head">
                <h3><Icon name="history" /> Latest sessions (all teachers)</h3>
                <Link to="/reports" className="small bold">Reports →</Link>
              </div>
              <div style={{ height: 14 }} />
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Course</th><th>Teacher</th><th>When</th><th>Present</th></tr></thead>
                  <tbody>
                    {data.recentSessions.length === 0 && <tr><td colSpan={4} className="muted">No sessions yet.</td></tr>}
                    {data.recentSessions.map((s) => (
                      <tr key={s.session_id}>
                        <td><b>{s.course_code}</b> <span className="muted small">{s.course_name}</span>
                          {s.is_live ? <span className="badge success" style={{ marginLeft: 8 }}><span className="live-dot" /> Live</span> : null}</td>
                        <td className="small">{s.teacher_name}</td>
                        <td className="muted small nowrap" title={fmtDateTime(s.created_at)}>{timeAgo(s.created_at)}</td>
                        <td style={{ minWidth: 150 }}>
                          <div className="pct-cell">
                            <Progress value={s.enrolled_count ? (s.present_count * 100) / s.enrolled_count : 0} />
                            <b className="text-2">{s.present_count}/{s.enrolled_count}</b>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3><Icon name="user" /> Newest accounts</h3>
                <span className="sub">{data.new_users_week} this week</span>
              </div>
              <div className="list">
                {data.recentUsers.map((u) => (
                  <Link key={u.user_id} to={`/admin/users?q=${encodeURIComponent(u.email)}`} className="list-item" style={{ color: 'inherit' }}>
                    <span className="grow">
                      <span className="title truncate" style={{ display: 'block' }}>{u.name}</span>
                      <span className="meta truncate" style={{ display: 'block' }}>{u.email}</span>
                    </span>
                    <span className={`badge ${ROLE_TONE[u.role]}`}>{u.role}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default AdminDashboard;
