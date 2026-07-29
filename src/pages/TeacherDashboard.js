import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Navbar from '../components/Navbar';
import API from '../api/axios';

function TeacherDashboard() {
  const [courseId, setCourseId] = useState('');
  const [expiry, setExpiry] = useState(10);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [closed, setClosed] = useState(false);

  const startSession = async () => {
    setError('');
    try {
      const res = await API.post('/sessions/start', {
        course_id: parseInt(courseId),
        expiry_minutes: parseInt(expiry),
      });
      setSession(res.data);
      setClosed(false);
      setLiveCount(0);
      startLiveCounter(res.data.session_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    }
  };

  const startLiveCounter = (session_id) => {
    const interval = setInterval(async () => {
      try {
        const res = await API.get(`/sessions/${session_id}/live`);
        setLiveCount(res.data.count);
      } catch (err) {}
    }, 3000);
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  const closeSession = async () => {
    try {
      await API.put(`/sessions/${session.session_id}/close`);
      setClosed(true);
    } catch (err) {}
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.heading}>Teacher Dashboard</h2>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Start Attendance Session</h3>
          <input
            style={styles.input}
            type="number"
            placeholder="Course ID (e.g. 1)"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          />
          <select
            style={styles.input}
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
          <button style={styles.button} onClick={startSession}>
            Generate QR Code
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </div>

        {session && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Active Session</h3>
            <p style={styles.meta}>Session ID: <b>{session.session_id}</b></p>
            <p style={styles.meta}>
              Expires at: <b>{new Date(session.expires_at).toLocaleTimeString()}</b>
            </p>
            <p style={styles.liveCount}>
              Students Scanned: <b>{liveCount}</b>
            </p>
            {!closed ? (
              <>
                <div style={styles.qrContainer}>
                  <QRCodeCanvas value={session.scan_url} size={220} />
                </div>
                <p style={styles.scanUrl}>{session.scan_url}</p>
                <button style={styles.closeBtn} onClick={closeSession}>
                  Close Session
                </button>
              </>
            ) : (
              <p style={styles.closedMsg}>Session has been closed.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: '40px auto', padding: '0 20px' },
  heading: { color: '#1F3864', marginBottom: '24px' },
  card: {
    backgroundColor: '#fff', padding: '24px',
    borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  },
  cardTitle: { color: '#2E75B6', marginBottom: '16px' },
  input: {
    width: '100%', padding: '10px', marginBottom: '12px',
    borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '14px', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '12px', backgroundColor: '#2E75B6',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '15px', cursor: 'pointer',
  },
  closeBtn: {
    width: '100%', padding: '12px', backgroundColor: '#c0392b',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '15px', cursor: 'pointer', marginTop: '12px',
  },
  error: { color: 'red', marginTop: '8px' },
  meta: { color: '#555', marginBottom: '6px' },
  liveCount: {
    fontSize: '18px', color: '#1F3864',
    margin: '12px 0', fontWeight: '500',
  },
  qrContainer: {
    display: 'flex', justifyContent: 'center',
    margin: '20px 0', padding: '20px',
    backgroundColor: '#f9f9f9', borderRadius: '8px',
  },
  scanUrl: {
    textAlign: 'center', color: '#888',
    fontSize: '12px', wordBreak: 'break-all',
  },
  closedMsg: {
    color: 'green', fontWeight: 'bold',
    textAlign: 'center', marginTop: '12px',
  },
};

export default TeacherDashboard;