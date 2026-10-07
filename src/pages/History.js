import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert, Empty, Loading, useFetch, fmtDate, fmtTime, downloadCSV } from '../components/ui';
import API, { errorMessage } from '../api/axios';

function History() {
  const [course, setCourse] = useState('');
  const { data, loading, error, reload } = useFetch(
    () => API.get('/attend/my-history').then((r) => r.data), []
  );

  const courses = useMemo(() => {
    const map = new Map();
    (data || []).forEach((h) => map.set(h.course_code, h.course_name));
    return [...map.entries()];
  }, [data]);

  const groups = useMemo(() => {
    const list = (data || []).filter((h) => !course || h.course_code === course);
    const out = [];
    list.forEach((h) => {
      const day = fmtDate(h.marked_at, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (!out.length || out[out.length - 1].day !== day) out.push({ day, items: [] });
      out[out.length - 1].items.push(h);
    });
    return out;
  }, [data, course]);

  return (
    <main className="page narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">Records</div>
          <h1>Attendance history</h1>
          <p>Every class you’ve checked in to.</p>
        </div>
        {data?.length > 0 && (
          <button className="btn btn-secondary" onClick={() => downloadCSV(
            'my_attendance.csv', ['Course code', 'Course', 'Date', 'Time'],
            data.map((h) => [h.course_code, h.course_name, fmtDate(h.marked_at), fmtTime(h.marked_at)])
          )}><Icon name="download" /> Export</button>
        )}
      </div>

      {loading && <Loading />}
      {error && <Alert>{errorMessage(error)} <button className="btn btn-sm btn-secondary" onClick={reload}>Retry</button></Alert>}

      {data && data.length === 0 && (
        <div className="card">
          <Empty icon="history" title="No check-ins yet" text="Your attendance will show up here after your first scan."
            action={<Link to="/scan" className="btn btn-primary"><Icon name="scan" /> Scan QR</Link>} />
        </div>
      )}

      {data && data.length > 0 && (
        <>
          {courses.length > 1 && (
            <div className="chips mb-2">
              <button className={`chip${!course ? ' on' : ''}`} onClick={() => setCourse('')}>All ({data.length})</button>
              {courses.map(([code]) => (
                <button key={code} className={`chip${course === code ? ' on' : ''}`} onClick={() => setCourse(code)}>{code}</button>
              ))}
            </div>
          )}
          <div className="stack">
            {groups.map((g) => (
              <div key={g.day} className="card">
                <div className="muted small bold mb-1">{g.day}</div>
                <div className="list">
                  {g.items.map((h) => (
                    <div key={h.session_id} className="list-item">
                      <div className="stat-icon tone-success" style={{ width: 36, height: 36 }}><Icon name="check" size={18} /></div>
                      <div className="grow">
                        <div className="title truncate">{h.course_name}</div>
                        <div className="meta">{h.course_code}</div>
                      </div>
                      <span className="badge">{fmtTime(h.marked_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

export default History;
