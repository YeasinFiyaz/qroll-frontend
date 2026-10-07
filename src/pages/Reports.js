import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import SessionRoster from '../components/SessionRoster';
import {
  Alert, ConfirmModal, Empty, Loading, PctCell, Progress, Spinner, Stat, THRESHOLD,
  useFetch, useToast, downloadCSV, fmtDateTime, fmtPct, fmtDate,
} from '../components/ui';
import API, { errorMessage } from '../api/axios';

const iso = (d) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

const RANGES = [
  { key: 'all', label: 'All time', get: () => ['', ''] },
  { key: '7', label: 'Last 7 days', get: () => [iso(new Date(Date.now() - 6 * 864e5)), iso(new Date())] },
  { key: '30', label: 'Last 30 days', get: () => [iso(new Date(Date.now() - 29 * 864e5)), iso(new Date())] },
  { key: 'month', label: 'This month', get: () => { const n = new Date(); return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(n)]; } },
];

function Reports() {
  const location = useLocation();
  const toast = useToast();
  const { data: courses, loading: coursesLoading, error: coursesError } = useFetch(
    () => API.get('/courses/my-courses').then((r) => r.data), []
  );

  const [courseId, setCourseId] = useState(location.state?.courseId ? String(location.state.courseId) : '');
  const [range, setRange] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [confirmAlerts, setConfirmAlerts] = useState(false);
  const [sending, setSending] = useState(false);
  const [rosterId, setRosterId] = useState(null);

  useEffect(() => {
    if (!courseId && courses?.length) setCourseId(String(courses[0].course_id));
  }, [courses, courseId]);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError('');
    try {
      const [r, s] = await Promise.all([
        API.get(`/reports/course/${courseId}`, {
          params: {
            // Local-midnight instants, so the range matches the teacher's own calendar days.
            from_ts: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
            to_ts: to ? new Date(new Date(`${to}T00:00:00`).getTime() + 864e5).toISOString() : undefined,
          },
        }),
        API.get(`/reports/course/${courseId}/sessions`),
      ]);
      setReport(r.data);
      setSessions(s.data);
    } catch (err) {
      setError(errorMessage(err, 'Failed to load report'));
    } finally {
      setLoading(false);
    }
  }, [courseId, from, to]);

  useEffect(() => { load(); }, [load]);

  const pickRange = (r) => {
    setRange(r.key);
    const [f, t] = r.get();
    setFrom(f);
    setTo(t);
  };

  const course = courses?.find((c) => String(c.course_id) === String(courseId));
  const rows = useMemo(() => {
    let list = report || [];
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => `${r.name} ${r.email}`.toLowerCase().includes(q));
    if (onlyLow) list = list.filter((r) => r.total_sessions > 0 && Number(r.percentage) < THRESHOLD);
    return list;
  }, [report, query, onlyLow]);

  const summary = useMemo(() => {
    const list = (report || []).filter((r) => r.total_sessions > 0);
    const avg = list.length ? list.reduce((a, r) => a + Number(r.percentage), 0) / list.length : null;
    const low = list.filter((r) => Number(r.percentage) < THRESHOLD).length;
    const sessionsInRange = report?.[0]?.total_sessions ?? 0;
    return { avg, low, sessionsInRange, students: report?.length || 0 };
  }, [report]);

  const visibleSessions = useMemo(() => sessions.filter((s) => {
    const day = iso(new Date(s.created_at));
    return (!from || day >= from) && (!to || day <= to);
  }), [sessions, from, to]);

  const exportCSV = () => {
    const label = from || to ? `_${from || 'start'}_to_${to || 'today'}` : '';
    downloadCSV(
      `attendance_${course?.course_code || courseId}${label}.csv`,
      ['Name', 'Email', 'Total Sessions', 'Attended', 'Percentage', 'Status'],
      (report || []).map((r) => [
        r.name, r.email, r.total_sessions, r.attended_sessions,
        r.percentage === null ? '' : `${r.percentage}%`,
        r.total_sessions === 0 ? 'No sessions' : Number(r.percentage) < THRESHOLD ? 'Low' : 'OK',
      ])
    );
  };

  const sendAlerts = async () => {
    setSending(true);
    try {
      const res = await API.post(`/reports/send-alerts/${courseId}`);
      toast(res.data.message);
      setConfirmAlerts(false);
    } catch (err) {
      toast(errorMessage(err, 'Failed to send alerts'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Insights</div>
          <h1>Attendance reports</h1>
          <p>Per-student percentages, session history, CSV export and low-attendance email alerts.</p>
        </div>
      </div>

      {coursesLoading && <Loading />}
      {coursesError && <Alert>{errorMessage(coursesError)}</Alert>}
      {courses && courses.length === 0 && (
        <div className="card"><Empty icon="bars" title="No courses yet" text="Create a course and run a session to see reports here." /></div>
      )}

      {courses && courses.length > 0 && (
        <>
          <div className="card mb-2">
            <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(2, minmax(140px, 1fr))', gap: 14 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Course</label>
                <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  {courses.map((c) => <option key={c.course_id} value={c.course_id}>{c.course_code} — {c.course_name}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>From</label>
                <input className="input" type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setRange(''); }} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>To</label>
                <input className="input" type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setRange(''); }} />
              </div>
            </div>
            <div className="chips mt-2">
              {RANGES.map((r) => (
                <button key={r.key} className={`chip${range === r.key ? ' on' : ''}`} onClick={() => pickRange(r)}>{r.label}</button>
              ))}
            </div>
          </div>

          <Alert>{error}</Alert>

          {loading && !report && <Loading label="Building report…" />}

          {report && (
            <>
              <div className="stats">
                <Stat icon="users" tone="info" value={summary.students} label="Students" />
                <Stat icon="qr" tone="warning" value={summary.sessionsInRange} label="Sessions in range" />
                <Stat icon="chart" tone="success" value={summary.avg === null ? '—' : fmtPct(summary.avg.toFixed(1))} label="Average attendance" />
                <Stat icon="alert" tone="danger" value={summary.low} label={`Below ${THRESHOLD}%`} />
              </div>

              <div className="card flush mb-2">
                <div className="card-head" style={{ flexWrap: 'wrap' }}>
                  <h3>
                    <Icon name="users" /> Students
                    {loading && <Spinner />}
                  </h3>
                  <div className="row wrap">
                    <div className="input-wrap search">
                      <Icon name="search" />
                      <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingTop: 8, paddingBottom: 8 }} />
                    </div>
                    <button className={`chip${onlyLow ? ' on' : ''}`} onClick={() => setOnlyLow(!onlyLow)}>Only below {THRESHOLD}%</button>
                    <button className="btn btn-secondary btn-sm" onClick={exportCSV} disabled={!report.length}><Icon name="download" size={15} /> Export CSV</button>
                    <button className="btn btn-danger-soft btn-sm" onClick={() => setConfirmAlerts(true)} disabled={!summary.low}><Icon name="mail" size={15} /> Email alerts</button>
                  </div>
                </div>
                <div style={{ height: 14 }} />
                {rows.length === 0 ? (
                  <Empty icon="users" title={report.length ? 'No matching students' : 'No students enrolled'} text={report.length ? 'Try a different search or filter.' : 'Enroll students from the course page.'} />
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Student</th><th className="num">Attended</th><th className="num">Total</th><th>Attendance</th><th>Last seen</th></tr></thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.user_id}>
                            <td><div className="bold">{r.name}</div><div className="muted xs">{r.email}</div></td>
                            <td className="num">{r.attended_sessions}</td>
                            <td className="num">{r.total_sessions}</td>
                            <td><PctCell value={r.percentage} total={r.total_sessions} /></td>
                            <td className="muted small">{r.last_attended ? fmtDate(r.last_attended, { day: 'numeric', month: 'short' }) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="card flush">
                <div className="card-head"><h3><Icon name="history" /> Sessions</h3><span className="sub">click a row for the roster</span></div>
                <div style={{ height: 14 }} />
                {visibleSessions.length === 0 ? (
                  <Empty icon="qr" title="No sessions in this range" />
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Date</th><th>Status</th><th>Present</th></tr></thead>
                      <tbody>
                        {visibleSessions.map((s) => (
                          <tr key={s.session_id} className="clickable" onClick={() => setRosterId(s.session_id)}>
                            <td>{fmtDateTime(s.created_at)}</td>
                            <td>{s.is_live ? <span className="badge success"><span className="live-dot" /> Live</span> : <span className="badge">Ended</span>}</td>
                            <td style={{ minWidth: 170 }}>
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
                )}
              </div>
            </>
          )}
        </>
      )}

      {confirmAlerts && (
        <ConfirmModal
          title="Send low-attendance emails?"
          text={`An email warning will be sent to ${summary.low} student(s) in ${course?.course_code} whose overall attendance is below ${THRESHOLD}%.`}
          confirmLabel="Send emails" busy={sending}
          onConfirm={sendAlerts} onClose={() => setConfirmAlerts(false)}
        />
      )}
      {rosterId && <SessionRoster sessionId={rosterId} onClose={() => setRosterId(null)} />}
    </main>
  );
}

export default Reports;
