import React from 'react';
import Icon from './Icon';
import { Modal, Loading, Alert, fmtDateTime, fmtTime, downloadCSV, useFetch } from './ui';
import API, { errorMessage } from '../api/axios';

// Present / absent list for one past session.
function SessionRoster({ sessionId, onClose }) {
  const { data, loading, error } = useFetch(
    () => API.get(`/attend/session/${sessionId}`).then((r) => r.data),
    [sessionId]
  );
  const students = data?.students || [];
  const present = students.filter((s) => s.present).length;

  const exportCSV = () => {
    downloadCSV(
      `session_${sessionId}_${data.session.course_code}.csv`,
      ['Name', 'Email', 'Status', 'Marked at'],
      students.map((s) => [s.name, s.email, s.present ? 'Present' : 'Absent', s.marked_at ? new Date(s.marked_at).toLocaleString() : ''])
    );
  };

  return (
    <Modal
      wide
      title={data ? `${data.session.course_code} · ${fmtDateTime(data.session.created_at)}` : 'Session'}
      onClose={onClose}
      footer={data && students.length > 0 && (
        <button className="btn btn-secondary" onClick={exportCSV}><Icon name="download" /> Export CSV</button>
      )}
    >
      {loading && <Loading />}
      {error && <Alert>{errorMessage(error)}</Alert>}
      {data && (
        <>
          <div className="row wrap mb-2">
            <span className="badge success"><Icon name="check" size={13} /> {present} present</span>
            <span className="badge danger"><Icon name="x" size={13} /> {students.length - present} absent</span>
            <span className="muted small">{data.session.course_name}</span>
          </div>
          {students.length === 0 ? (
            <p className="muted">No students enrolled in this course yet.</p>
          ) : (
            <div className="table-wrap card flush" style={{ boxShadow: 'none' }}>
              <table className="table">
                <thead><tr><th>Student</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.user_id}>
                      <td><div className="bold">{s.name}</div><div className="muted xs">{s.email}</div></td>
                      <td>{s.present
                        ? <span className="badge success">Present</span>
                        : <span className="badge danger">Absent</span>}</td>
                      <td className="muted">{s.marked_at ? fmtTime(s.marked_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export default SessionRoster;
