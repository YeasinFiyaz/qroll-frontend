import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert, Empty, Loading, Modal, Spinner, useFetch, useToast, timeAgo } from '../components/ui';
import API, { errorMessage } from '../api/axios';
import { useAuth } from '../auth';
import { useFeatures } from '../features';

function CreateCourseModal({ onClose, onCreated, isAdmin }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    API.get('/admin/teachers').then((r) => {
      setTeachers(r.data);
      if (r.data[0]) setTeacherId(String(r.data[0].user_id));
    }).catch(() => {});
  }, [isAdmin]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = { course_name: name.trim(), course_code: code.trim() };
      const res = isAdmin
        ? await API.post('/admin/courses', { ...body, teacher_id: Number(teacherId) })
        : await API.post('/courses/create', body);
      onCreated(res.data.course_id);
    } catch (err) {
      setError(errorMessage(err, 'Failed to create course'));
      setBusy(false);
    }
  };

  return (
    <Modal title="Create a new course" onClose={onClose}>
      <form onSubmit={submit}>
        <Alert>{error}</Alert>
        <div className="field">
          <label htmlFor="cname">Course name</label>
          <input id="cname" className="input" placeholder="e.g. Software Engineering" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="ccode">Course code</label>
          <input id="ccode" className="input" placeholder="e.g. CSE301" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
          <span className="hint">Must be unique. Add a section if you teach several, e.g. CSE301-A.</span>
        </div>
        {isAdmin && (
          <div className="field">
            <label htmlFor="teacher">Teacher</label>
            <select id="teacher" className="input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
              {teachers.map((t) => <option key={t.user_id} value={t.user_id}>{t.name} — {t.email}</option>)}
            </select>
          </div>
        )}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? <Spinner /> : <Icon name="plus" />} Create course
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Courses() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOn } = useFeatures();
  const isAdmin = user?.role === 'admin';
  const canCreate = isOn('teacher.can_create_course');
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const { data: courses, loading, error, reload } = useFetch(
    () => API.get('/courses/my-courses').then((r) => r.data), []
  );
  const q = query.trim().toLowerCase();
  const shown = (courses || []).filter((c) => !q || `${c.course_name} ${c.course_code} ${c.teacher_name || ''}`.toLowerCase().includes(q));

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{isAdmin ? 'Administration' : 'Teaching'}</div>
          <h1>{isAdmin ? 'All courses' : 'Courses'}</h1>
          <p>{isAdmin ? 'Every course on QRoll, from every teacher. Open one to manage students, sessions or delete it.' : 'Create courses, add students and open any course to run attendance.'}</p>
        </div>
        {canCreate && <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" /> New course</button>}
      </div>

      {loading && <Loading />}
      {error && <Alert>{errorMessage(error)} <button className="btn btn-sm btn-secondary" onClick={reload}>Retry</button></Alert>}

      {courses && courses.length === 0 && (
        <div className="card">
          <Empty
            icon="book" title="No courses yet"
            text={canCreate ? 'Create your first course, then add students by email — or let them join by scanning your first QR.' : 'Courses are created by the administrator.'}
            action={canCreate && <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" /> Create course</button>}
          />
        </div>
      )}

      {courses && courses.length > 0 && (
        <>
          {courses.length > 6 && (
            <div className="input-wrap search mb-2" style={{ maxWidth: 320 }}>
              <Icon name="search" />
              <input className="input" placeholder="Search courses" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          )}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {shown.map((c) => (
              <div key={c.course_id} className="course-card" onClick={() => navigate(`/courses/${c.course_id}`)}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="badge brand">{c.course_code}</span>
                  <Icon name="arrowRight" size={16} className="muted" />
                </div>
                <h3>{c.course_name}</h3>
                {isAdmin && c.teacher_name && <div className="small text-2 truncate"><Icon name="user" size={13} /> {c.teacher_name}</div>}
                <div className="foot">
                  <span><Icon name="users" size={15} /> {c.student_count} students</span>
                  <span><Icon name="qr" size={15} /> {c.session_count} sessions</span>
                </div>
                <div className="muted xs">
                  {c.last_session_at ? `Last session ${timeAgo(c.last_session_at)}` : 'No sessions yet'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {creating && (
        <CreateCourseModal
          isAdmin={isAdmin}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            toast('Course created!');
            navigate(`/courses/${id}`);
          }}
        />
      )}
    </main>
  );
}

export default Courses;
