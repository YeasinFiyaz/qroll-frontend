import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import StartSession from '../components/StartSession';
import SessionRoster from '../components/SessionRoster';
import {
  Alert, ConfirmModal, Empty, Loading, Modal, PctCell, Progress, Spinner, Stat,
  useFetch, useToast, fmtDateTime, fmtPct, downloadCSV,
} from '../components/ui';
import API, { errorMessage } from '../api/axios';

function EnrollCard({ courseId, onDone }) {
  const toast = useToast();
  const [emails, setEmails] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await API.post('/courses/enroll', { course_id: courseId, student_email: emails });
      setResult({ type: 'success', ...res.data });
      if (res.data.enrolled?.length) {
        toast(res.data.message);
        onDone();
      }
      if (!res.data.notFound?.length) setEmails('');
    } catch (err) {
      setResult({ type: 'error', message: errorMessage(err), ...(err.response?.data || {}) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="card-head"><h3><Icon name="plus" /> Add students</h3></div>
      <form onSubmit={submit}>
        <div className="field">
          <textarea
            className="input" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)}
            placeholder={'student@university.edu\nanother@university.edu'} required
          />
          <span className="hint">One or many emails (comma or new line). Students need a QRoll account first. Tip: students who scan your QR are added automatically.</span>
        </div>
        {result && (
          <Alert type={result.type === 'error' ? 'error' : 'success'}>
            {result.message || result.error}
            {result.notFound?.length > 0 && <div className="xs mt-1">No account: {result.notFound.join(', ')}</div>}
          </Alert>
        )}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <Spinner /> : <Icon name="users" />} Enroll
        </button>
      </form>
    </div>
  );
}

function EditCourseModal({ course, onClose, onSaved }) {
  const [name, setName] = useState(course.course_name);
  const [code, setCode] = useState(course.course_code);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await API.put(`/courses/${course.course_id}`, { course_name: name, course_code: code });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };
  return (
    <Modal title="Edit course" onClose={onClose}>
      <form onSubmit={save}>
        <Alert>{error}</Alert>
        <div className="field"><label>Course name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="field"><label>Course code</label><input className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required /></div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy && <Spinner />} Save</button>
        </div>
      </form>
    </Modal>
  );
}

function CourseDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [tab, setTab] = useState('students');
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rosterId, setRosterId] = useState(null);

  const { data, loading, error, reload } = useFetch(async () => {
    const [courses, students, sessions] = await Promise.all([
      API.get('/courses/my-courses'),
      API.get(`/courses/${id}/students`),
      API.get(`/reports/course/${id}/sessions`),
    ]);
    const course = courses.data.find((c) => String(c.course_id) === String(id));
    return { course, students: students.data, sessions: sessions.data };
  }, [id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!data) return [];
    return q ? data.students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(q)) : data.students;
  }, [data, query]);

  const avg = useMemo(() => {
    const withSessions = (data?.students || []).filter((s) => s.total_sessions > 0);
    if (!withSessions.length) return null;
    return withSessions.reduce((a, s) => a + Number(s.percentage), 0) / withSessions.length;
  }, [data]);

  const removeStudent = async () => {
    setRemoveBusy(true);
    try {
      await API.delete(`/courses/${id}/students/${removing.user_id}`);
      toast(`${removing.name} removed from course`);
      setRemoving(null);
      reload();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setRemoveBusy(false);
    }
  };

  if (loading && !data) return <main className="page"><Loading /></main>;
  if (error) return <main className="page"><Alert>{errorMessage(error)}</Alert><Link to="/courses" className="btn btn-secondary">Back to courses</Link></main>;
  if (!data?.course) {
    return (
      <main className="page">
        <div className="card"><Empty icon="book" title="Course not found" action={<Link to="/courses" className="btn btn-primary">Back to courses</Link>} /></div>
      </main>
    );
  }
  const { course, students, sessions } = data;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <Link to="/courses" className="btn btn-ghost btn-sm" style={{ marginLeft: -10 }}><Icon name="arrowLeft" size={16} /> Courses</Link>
          <div className="row mt-1">
            <span className="badge brand">{course.course_code}</span>
            <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditing(true)} title="Edit course"><Icon name="edit" size={15} /></button>
          </div>
          <h1 className="mt-1">{course.course_name}</h1>
        </div>
        <Link to="/reports" state={{ courseId: course.course_id }} className="btn btn-secondary"><Icon name="bars" /> Full report</Link>
      </div>

      <div className="stats">
        <Stat icon="users" tone="info" value={students.length} label="Students" />
        <Stat icon="qr" tone="warning" value={sessions.length} label="Sessions" />
        <Stat icon="chart" tone="success" value={avg === null ? '—' : fmtPct(avg.toFixed(1))} label="Avg. attendance" />
      </div>

      <div className="grid grid-main">
        <div className="card">
          <div className="tabs">
            <button className={tab === 'students' ? 'on' : ''} onClick={() => setTab('students')}><Icon name="users" size={16} /> Students ({students.length})</button>
            <button className={tab === 'sessions' ? 'on' : ''} onClick={() => setTab('sessions')}><Icon name="history" size={16} /> Sessions ({sessions.length})</button>
          </div>

          {tab === 'students' && (
            students.length === 0 ? (
              <Empty icon="users" title="No students yet" text="Add students by email, or start a session — students who scan are added automatically." />
            ) : (
              <>
                <div className="row mb-2">
                  <div className="input-wrap search" style={{ flex: 1 }}>
                    <Icon name="search" />
                    <input className="input" placeholder="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => downloadCSV(
                    `${course.course_code}_students.csv`,
                    ['Name', 'Email', 'Attended', 'Total', 'Percentage'],
                    students.map((s) => [s.name, s.email, s.attended_sessions, s.total_sessions, s.percentage ?? ''])
                  )}><Icon name="download" size={15} /> CSV</button>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Student</th><th>Classes</th><th>Attendance</th><th /></tr></thead>
                    <tbody>
                      {filtered.map((s) => (
                        <tr key={s.user_id}>
                          <td><div className="bold">{s.name}</div><div className="muted xs">{s.email}</div></td>
                          <td className="muted">{s.attended_sessions}/{s.total_sessions}</td>
                          <td><PctCell value={s.percentage} total={s.total_sessions} /></td>
                          <td className="num">
                            <button className="icon-btn danger" title="Remove from course" onClick={() => setRemoving(s)}><Icon name="trash" size={15} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}

          {tab === 'sessions' && (
            sessions.length === 0 ? (
              <Empty icon="qr" title="No sessions yet" text="Start one from the panel on the right." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Date</th><th>Status</th><th>Present</th></tr></thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.session_id} className="clickable" onClick={() => setRosterId(s.session_id)}>
                        <td className="nowrap">{fmtDateTime(s.created_at)}</td>
                        <td>{s.is_live
                          ? <Link to={`/session/${s.session_id}`} onClick={(e) => e.stopPropagation()} className="badge success"><span className="live-dot" /> Live</Link>
                          : <span className="badge">Ended</span>}</td>
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
            )
          )}
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><h3><Icon name="play" /> Start attendance</h3></div>
            <StartSession courses={[course]} defaultCourseId={String(course.course_id)} compact />
          </div>
          <EnrollCard courseId={course.course_id} onDone={reload} />
        </div>
      </div>

      {removing && (
        <ConfirmModal
          title="Remove student?"
          text={`${removing.name} will be removed from ${course.course_code}. Their past attendance records are kept.`}
          confirmLabel="Remove" danger busy={removeBusy}
          onConfirm={removeStudent} onClose={() => setRemoving(null)}
        />
      )}
      {editing && (
        <EditCourseModal course={course} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); toast('Course updated'); reload(); }} />
      )}
      {rosterId && <SessionRoster sessionId={rosterId} onClose={() => setRosterId(null)} />}
    </main>
  );
}

export default CourseDetail;
