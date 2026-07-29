import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';

function Reports() {
  const [courseId, setCourseId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState([]);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setError('');
    try {
      const res = await API.get(`/reports/course/${courseId}`, {
        params: { from, to },
      });
      setReport(res.data);
    } catch (err) {
      setError('Failed to load report');
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Total Sessions', 'Attended', 'Percentage'];
    const rows = report.map((r) => [
      r.name, r.email, r.total_sessions, r.attended_sessions, r.percentage + '%',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_course_${courseId}.csv`;
    a.click();
  };

  const sendAlerts = async () => {
    try {
      const res = await API.post(`/reports/send-alerts/${courseId}`);
      alert(res.data.message);
    } catch (err) {
      alert('Failed to send alerts');
    }
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.heading}>Attendance Reports</h2>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Filter Report</h3>
          <input
            style={styles.input}
            type="number"
            placeholder="Course ID"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          />
          <input
            style={styles.input}
            type="date"
            placeholder="From date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            style={styles.input}
            type="date"
            placeholder="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button style={styles.button} onClick={loadReport}>
            Generate Report
          </button>
          {error && <p style={styles.error}>{error}</p>}
        </div>

        {report.length > 0 && (
          <div style={styles.card}>
            <div style={styles.reportHeader}>
              <h3 style={styles.cardTitle}>Results</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={styles.exportBtn} onClick={exportCSV}>
                  ⬇ Export CSV
                </button>
                <button style={styles.alertBtn} onClick={sendAlerts}>
                  📧 Send Alerts
                </button>
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Attended</th>
                  <th style={styles.th}>%</th>
                </tr>
              </thead>
              <tbody>
                {report.map((row, i) => (
                  <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>{row.name}</td>
                    <td style={styles.td}>{row.email}</td>
                    <td style={styles.td}>{row.total_sessions}</td>
                    <td style={styles.td}>{row.attended_sessions}</td>
                    <td style={{
                      ...styles.td,
                      color: row.percentage < 75 ? 'red' : 'green',
                      fontWeight: 'bold',
                    }}>
                      {row.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '700px', margin: '40px auto', padding: '0 20px' },
  heading: { color: '#1F3864', marginBottom: '24px' },
  card: {
    backgroundColor: '#fff', padding: '24px',
    borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  },
  cardTitle: { color: '#2E75B6', marginBottom: '12px' },
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
  exportBtn: {
    padding: '8px 16px', backgroundColor: '#27ae60',
    color: '#fff', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px',
  },
  alertBtn: {
    padding: '8px 16px', backgroundColor: '#c0392b',
    color: '#fff', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '13px',
  },
  reportHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '12px',
  },
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

export default Reports;