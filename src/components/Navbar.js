import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={styles.navbar}>
      <div style={styles.left}>
        <span style={styles.logo}>QRoll</span>
        <span style={styles.role}>{role}</span>
      </div>
      <div style={styles.right}>
        <span style={styles.name}>👤 {name}</span>
        {(role === 'teacher' || role === 'admin') && (
          <>
            <button style={styles.btn} onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button style={styles.btn} onClick={() => navigate('/courses')}>Courses</button>
            <button style={styles.btn} onClick={() => navigate('/reports')}>Reports</button>
          </>
        )}
        <button style={styles.logout} onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: '#1F3864',
    padding: '12px 24px', color: '#fff',
  },
  left: { display: 'flex', alignItems: 'center', gap: '12px' },
  right: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { fontSize: '22px', fontWeight: 'bold', color: '#fff' },
  role: {
    backgroundColor: '#2E75B6', padding: '2px 10px',
    borderRadius: '12px', fontSize: '12px',
  },
  name: { fontSize: '14px' },
  btn: {
    backgroundColor: '#2E75B6', color: '#fff',
    border: 'none', padding: '8px 16px',
    borderRadius: '8px', cursor: 'pointer',
  },
  logout: {
    backgroundColor: '#c0392b', color: '#fff',
    border: 'none', padding: '8px 16px',
    borderRadius: '8px', cursor: 'pointer',
  },
};

export default Navbar;