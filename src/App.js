import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import Scanner from './pages/Scanner';
import Reports from './pages/Reports';
import Courses from './pages/Courses';

function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={token && role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/" />} />
        <Route path="/scan" element={token && role === 'student' ? <Scanner /> : <Navigate to="/" />} />
        <Route path="/reports" element={token ? <Reports /> : <Navigate to="/" />} />
        <Route path="/courses" element={token && role === 'teacher' ? <Courses /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;