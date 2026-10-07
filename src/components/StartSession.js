import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { Alert, Spinner } from './ui';
import API, { errorMessage } from '../api/axios';

const DURATIONS = [5, 10, 15, 30, 60, 90];

// Course picker + duration chips. Starting a session opens the live QR screen.
function StartSession({ courses, defaultCourseId, compact }) {
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState(defaultCourseId || '');
  const [minutes, setMinutes] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId && courses?.length) setCourseId(String(courses[0].course_id));
  }, [courses, courseId]);

  const start = async () => {
    setError('');
    if (!courseId) return setError('Please choose a course');
    setBusy(true);
    try {
      const res = await API.post('/sessions/start', {
        course_id: Number(courseId),
        expiry_minutes: Number(minutes),
      });
      navigate(`/session/${res.data.session_id}`, { state: { session: res.data } });
    } catch (err) {
      setError(errorMessage(err, 'Could not start the session'));
      setBusy(false);
    }
  };

  return (
    <div>
      <Alert>{error}</Alert>
      {!defaultCourseId && (
        <div className="field">
          <label htmlFor="course">Course</label>
          <select id="course" className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses?.map((c) => (
              <option key={c.course_id} value={c.course_id}>{c.course_code} — {c.course_name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label>QR stays valid for</label>
        <div className="chips">
          {DURATIONS.map((m) => (
            <button key={m} type="button" className={`chip${Number(minutes) === m ? ' on' : ''}`} onClick={() => setMinutes(m)}>
              {m < 60 ? `${m} min` : `${m / 60 === 1 ? '1 hour' : `${m / 60} hours`}`}
            </button>
          ))}
        </div>
      </div>
      <button className={`btn btn-primary btn-block${compact ? '' : ' btn-lg'} mt-1`} onClick={start} disabled={busy}>
        {busy ? <><Spinner /> Starting…</> : <><Icon name="qr" /> Generate QR code</>}
      </button>
    </div>
  );
}

export default StartSession;
