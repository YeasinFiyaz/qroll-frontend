import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import StartSession from '../components/StartSession';
import SessionRoster from '../components/SessionRoster';
import {
  Stat, Empty, Loading, Alert, Progress, PctCell, useFetch, greeting, fmtPct, timeAgo, fmtTime,
} from '../components/ui';
import API, { errorMessage } from '../api/axios';
import { useAuth } from '../auth';

function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rosterId, setRosterId] = useState(null);

  const { data, loading, error, reload } = useFetch(async () => {
    const [overview, courses, active, history, low] = await Promise.all([
      API.get('/reports/overview', { params: { tz: -new Date().getTimezoneOffset() } }),
      API.get('/courses/my-courses'),
      API.get('/sessions/active'),
      API.get('/sessions/history'),
      API.get('/reports/low-attendance'),
    ]);
    return {
      overview: overview.data, courses: courses.data, active: active.data,
      history: history.data.filter((s) => !s.is_live).slice(0, 8), low: low.data.slice(0, 6),
    };
  }, []);

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <main className="page">
      <section className="hero">
        <div className="row wrap" style={{ justifyContent: 'space-between', gap: 18 }}>
          <div>
            <h1>{greeting()}, {firstName} 👋</h1>
            <p>Start a QR session, watch students check in live, and track attendance across your courses.</p>
          </div>
          <Link to="/courses" className="btn btn-white"><Icon name="plus" /> New course</Link>
        </div>
      </section>

      {loading && <Loading label="Loading your dashboard…" />}
      {error && <Alert>{errorMessage(error)} <button className="btn btn-sm btn-secondary" onClick={reload}>Retry</button></Alert>}

      {data && (
        <>
          <div className="stats">
            <Stat icon="book" tone="brand" value={data.overview.courses} label="Courses" />
            <Stat icon="users" tone="info" value={data.overview.students} label="Students" />
            <Stat icon="qr" tone="warning" value={data.overview.sessions} label="Sessions held" />
            <Stat icon="chart" tone="success" value={data.overview.avg_attendance === null ? '—' : fmtPct(data.overview.avg_attendance)} label="Avg. attendance" />
            <Stat icon="checkCircle" tone="success" value={data.overview.scans_today} label="Check-ins today" />
          </div>

          <div className="grid grid-main">
            <div className="stack">
              {data.active.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <h3><span className="badge success"><span className="live-dot" /> LIVE</span> Running sessions</h3>
                  </div>
                  <div className="list">
                    {data.active.map((s) => (
                      <div key={s.session_id} className="list-item clickable" onClick={() => navigate(`/session/${s.session_id}`)}>
                        <div className="stat-icon tone-success"><Icon name="qr" /></div>
                        <div className="grow">
                          <div className="title">{s.course_code} · {s.course_name}</div>
                          <div className="meta">Ends at {fmtTime(s.expires_at)} · {s.present_count} checked in</div>
                        </div>
                        <span className="btn btn-sm btn-secondary">Open <Icon name="arrowRight" size={15} /></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-head"><h3><Icon name="play" /> Start attendance</h3></div>
                {data.courses.length === 0 ? (
                  <Empty
                    icon="book" title="Create your first course"
                    text="You need a course before you can start an attendance session."
                    action={<Link to="/courses" className="btn btn-primary"><Icon name="plus" /> Create course</Link>}
                  />
                ) : (
                  <StartSession courses={data.courses} />
                )}
              </div>

              <div className="card flush">
                <div className="card-head">
                  <h3><Icon name="history" /> Recent sessions</h3>
                  <Link to="/reports" className="small bold">All reports →</Link>
                </div>
                {data.history.length === 0 ? (
                  <Empty icon="history" title="No sessions yet" text="Sessions you run will appear here." />
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Course</th><th>When</th><th>Present</th></tr></thead>
                      <tbody>
                        {data.history.map((s) => {
                          const pct = s.enrolled_count ? (s.present_count * 100) / s.enrolled_count : 0;
                          return (
                            <tr key={s.session_id} className="clickable" onClick={() => setRosterId(s.session_id)}>
                              <td><b>{s.course_code}</b> <span className="muted small">{s.course_name}</span></td>
                              <td className="muted small">{timeAgo(s.created_at)}</td>
                              <td style={{ minWidth: 160 }}>
                                <div className="pct-cell">
                                  <Progress value={pct} />
                                  <b className="text-2">{s.present_count}/{s.enrolled_count}</b>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="stack">
              <div className="card">
                <div className="card-head">
                  <h3><Icon name="book" /> My courses</h3>
                  <Link to="/courses" className="small bold">Manage →</Link>
                </div>
                {data.courses.length === 0 ? (
                  <p className="muted small">No courses yet.</p>
                ) : (
                  <div className="list">
                    {data.courses.slice(0, 6).map((c) => (
                      <Link key={c.course_id} to={`/courses/${c.course_id}`} className="list-item" style={{ color: 'inherit' }}>
                        <span className="badge brand">{c.course_code}</span>
                        <div className="grow">
                          <div className="title truncate">{c.course_name}</div>
                          <div className="meta">{c.student_count} students · {c.session_count} sessions</div>
                        </div>
                        <Icon name="arrowRight" size={16} className="muted" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-head">
                  <h3><Icon name="alert" style={{ color: 'var(--danger)' }} /> Needs attention</h3>
                  <span className="sub">below {data.overview.threshold}%</span>
                </div>
                {data.low.length === 0 ? (
                  <p className="muted small">Everyone is above {data.overview.threshold}% — great job! 🎉</p>
                ) : (
                  <div className="list">
                    {data.low.map((s, i) => (
                      <div key={i} className="list-item">
                        <div className="grow">
                          <div className="title truncate">{s.name}</div>
                          <div className="meta">{s.course_code} · {s.attended_sessions}/{s.total_sessions} classes</div>
                        </div>
                        <div style={{ width: 120 }}><PctCell value={s.percentage} total={s.total_sessions} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {rosterId && <SessionRoster sessionId={rosterId} onClose={() => setRosterId(null)} />}
    </main>
  );
}

export default TeacherDashboard;
