import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import {
  Alert, Empty, Loading, PctPill, Progress, Ring, THRESHOLD, useFetch, greeting, firstName, pctTone, timeAgo, fmtTime,
} from '../components/ui';
import API, { errorMessage } from '../api/axios';
import { useAuth } from '../auth';

function StudentHome() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(async () => {
    const [courses, history] = await Promise.all([
      API.get('/courses/enrolled'),
      API.get('/attend/my-history'),
    ]);
    return { courses: courses.data, history: history.data };
  }, []);

  const totals = (data?.courses || []).reduce(
    (a, c) => ({ total: a.total + Number(c.total_sessions), attended: a.attended + Number(c.attended_sessions) }),
    { total: 0, attended: 0 }
  );
  const overall = totals.total ? (totals.attended * 100) / totals.total : null;
  const low = (data?.courses || []).filter((c) => c.total_sessions > 0 && Number(c.percentage) < THRESHOLD);
  const first = firstName(user?.name);

  return (
    <main className="page">
      <section className="hero">
        <div className="row wrap" style={{ justifyContent: 'space-between', gap: 18 }}>
          <div>
            <h1>{greeting()}, {first} 👋</h1>
            <p>In class? Scan your teacher’s QR to check in.</p>
          </div>
          <Link to="/scan" className="btn btn-white btn-lg"><Icon name="scan" /> Scan QR</Link>
        </div>
      </section>

      {loading && <Loading />}
      {error && <Alert>{errorMessage(error)} <button className="btn btn-sm btn-secondary" onClick={reload}>Retry</button></Alert>}

      {data && (
        <>
          {low.length > 0 && (
            <Alert type="warning">
              Your attendance is below {THRESHOLD}% in {low.map((c) => c.course_code).join(', ')}. Try not to miss the next classes.
            </Alert>
          )}

          <div className="grid grid-main">
            <div className="card">
              <div className="card-head"><h3><Icon name="book" /> My courses</h3></div>
              {data.courses.length === 0 ? (
                <Empty
                  icon="book" title="No courses yet"
                  text="Scan your first class QR and the course will be added here automatically."
                  action={<Link to="/scan" className="btn btn-primary"><Icon name="scan" /> Scan now</Link>}
                />
              ) : (
                <div className="list">
                  {data.courses.map((c) => (
                    <div key={c.course_id} className="list-item">
                      <div className="grow">
                        <div className="row" style={{ gap: 8 }}>
                          <span className="badge brand">{c.course_code}</span>
                          <span className="title clamp2">{c.course_name}</span>
                        </div>
                        <div className="meta truncate">{c.teacher_name} · {c.attended_sessions}/{c.total_sessions} classes</div>
                        <div className="mini-progress"><Progress value={c.total_sessions > 0 ? c.percentage : 0} tone={pctTone(c.percentage, c.total_sessions > 0)} /></div>
                      </div>
                      <PctPill value={c.percentage} total={c.total_sessions} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="stack">
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Ring value={overall === null ? null : Number(overall.toFixed(1))} size={124} label="overall" />
                <div>
                  <h3 style={{ fontSize: 16 }}>Overall attendance</h3>
                  <p className="muted small mt-1">{totals.attended} of {totals.total} classes attended across {data.courses.length} course{data.courses.length === 1 ? '' : 's'}.</p>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <h3><Icon name="history" /> Recent check-ins</h3>
                  <Link to="/history" className="small bold">See all →</Link>
                </div>
                {data.history.length === 0 ? (
                  <p className="muted small">No check-ins yet.</p>
                ) : (
                  <div className="list">
                    {data.history.slice(0, 5).map((h) => (
                      <div key={h.session_id} className="list-item">
                        <div className="stat-icon tone-success" style={{ width: 36, height: 36 }}><Icon name="check" size={18} /></div>
                        <div className="grow">
                          <div className="title truncate">{h.course_code} · {h.course_name}</div>
                          <div className="meta">{timeAgo(h.marked_at)} · {fmtTime(h.marked_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default StudentHome;
