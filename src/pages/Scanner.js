import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';

function Scanner() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const markAttendance = async () => {
    setMessage(''); setError('');
    try {
      const res = await API.post('/attend/scan', { token });
      setMessage(res.data.message);
      setToken('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark attendance');
    }
  };

  const loadHistory = async () => {
    try {
      const res = await API.get('/attend/my-history');
      setHistory(res.data);
      setShowHistory(true);
    } catch (err) {}
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.heading}>Mark Attendance</h2>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Enter Session Token</h3>
          <p style={styles.hint}>
            Ask your teacher for the session token or scan the QR code.
          </p>
          <input
            style={styles.input}
            type="text"
            placeholder="Paste session token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button style={styles.button} onClick={markAttendance}>
            ✅ Mark Attendance
          </button>
          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </div>

        <button style={styles.historyBtn} onClick={loadHistory}>
          📋 View My Attendance History
        </button>

        {showHistory && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>My Attendance History</h3>
            {history.length === 0 ? (
              <p style={styles.hint}>No attendance records found.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Course</th>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>{row.course_name}</td>
                      <td style={styles.td}>{row.course_code}</td>
                      <td style={styles.td}>{new Date(row.marked_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  cardTitle: { color: '#2E75B6', marginBottom: '12px' },
  hint: { color: '#888', fontSize: '13px', marginBottom: '12px' },
  input: {
    width: '100%', padding: '10px', marginBottom: '12px',
    borderRadius: '8px', border: '1px solid #ddd',
    fontSize: '14px', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '12px', backgroundColor: '#27ae60',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '15px', cursor: 'pointer',
  },
  historyBtn: {
    width: '100%', padding: '12px', backgroundColor: '#2E75B6',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '15px', cursor: 'pointer', marginBottom: '24px',
  },
  success: { color: 'green', marginTop: '8px', fontWeight: 'bold' },
  error: { color: 'red', marginTop: '8px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    backgroundColor: '#2E75B6', color: '#fff',
    padding: '10px', textAlign: 'left', fontSize: '13px',
  },
  td: { padding: '10px', fontSize: '13px' },
  rowEven: { backgroundColor: '#f9f9f9' },
  rowOdd: { backgroundColor: '#fff' },
};

export default Scanner;