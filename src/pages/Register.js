import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirm) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      await API.post('/auth/register', {
        name: name,
        email: email,
        password: password,
        role: role,
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>QRoll</h1>
        <p style={styles.subtitle}>Create an Account</p>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <form onSubmit={handleRegister}>
          <input
            style={styles.input}
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <div style={styles.roleContainer}>
            <p style={styles.roleLabel}>I am a:</p>
            <div style={styles.roleButtons}>
              <button
                type="button"
                style={role === 'student' ? styles.roleBtnActive : styles.roleBtn}
                onClick={() => setRole('student')}
              >
                Student
              </button>
              <button
                type="button"
                style={role === 'teacher' ? styles.roleBtnActiveTeacher : styles.roleBtn}
                onClick={() => setRole('teacher')}
              >
                Teacher
              </button>
            </div>
          </div>

          <button style={styles.button} type="submit">
            Create Account
          </button>
        </form>

        <p style={styles.loginLink}>
          Already have an account?{' '}
          <span style={styles.link} onClick={() => navigate('/')}>
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    fontSize: '36px',
    color: '#1F3864',
    marginBottom: '4px',
  },
  subtitle: {
    color: '#888',
    marginBottom: '24px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  roleContainer: {
    marginBottom: '20px',
    textAlign: 'left',
  },
  roleLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#444',
    marginBottom: '8px',
  },
  roleButtons: {
    display: 'flex',
    gap: '10px',
  },
  roleBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
    backgroundColor: '#f0f4f8',
    color: '#555',
    border: '2px solid #ddd',
  },
  roleBtnActive: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
    backgroundColor: '#2E75B6',
    color: '#fff',
    border: '2px solid #2E75B6',
  },
  roleBtnActiveTeacher: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
    backgroundColor: '#1F3864',
    color: '#fff',
    border: '2px solid #1F3864',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    marginBottom: '12px',
  },
  success: {
    color: 'green',
    marginBottom: '12px',
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: '20px',
    color: '#888',
    fontSize: '14px',
  },
  link: {
    color: '#2E75B6',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};

export default Register;