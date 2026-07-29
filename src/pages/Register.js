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
    setError(''); setSuccess('');

    if (password !== confirm) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      await API.post('/auth/register', {
        name, email, password, role,
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
                style={{
                  ...styles.roleBtn,
                  backgroundColor: role === 'student' ? '#2E75B6' : '#f0f4f8',
                  color: role === 'student' ? '#fff' : '#555',
                  border: role === 'student' ? '2px solid #2E75B6' : '2px solid #ddd',
                }}
                onClick={() => setRole('student')}
              >
                🎓 Student
              </button>
              <button
                type="button"
                style={{
                  ...styles.roleBtn,
                  backgroundColor: role === 'teacher' ? '#1F3864' : '#f0f4f8',
                  color: role === 'teacher' ? '#fff' : '#555',
                  border: role === 'teacher' ? '2px solid #1F3864' : '2px solid #ddd',
                }}
                onClick={() => setRole('teacher')}
              >
                👨‍🏫 Teacher
              </button>
            </div>