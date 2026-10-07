import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth, homeFor } from './auth';
import { FeatureProvider, useFeatures } from './features';
import { ToastProvider } from './components/ui';
import { warmUp } from './api/axios';
import Navbar from './components/Navbar';
import Backdrop from './components/Backdrop';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import LiveSession from './pages/LiveSession';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Reports from './pages/Reports';
import StudentHome from './pages/StudentHome';
import Scanner from './pages/Scanner';
import History from './pages/History';
import Profile from './pages/Profile';
import Disabled from './pages/Disabled';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';

// Guards read auth from context, so they update the moment someone logs in or out.
function RequireAuth({ role }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (role === 'admin' && user.role !== 'admin') return <Navigate to={homeFor(user)} replace />;
  if (role === 'teacher' && user.role === 'student') return <Navigate to="/student" replace />;
  if (role === 'student' && user.role !== 'student') return <Navigate to={homeFor(user)} replace />;
  return (
    <div className="app-shell">
      <Backdrop />
      <Navbar />
      <Outlet />
    </div>
  );
}

// Renders the page only while the admin's switch for it is on.
function Feature({ flag, what, children }) {
  const { isOn } = useFeatures();
  return isOn(flag) ? children : <Disabled what={what} />;
}

function GuestOnly({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user) {
    const next = new URLSearchParams(location.search).get('next');
    return <Navigate to={next && next.startsWith('/') ? next : homeFor(user)} replace />;
  }
  return children;
}

function Home() {
  const { user } = useAuth();
  const location = useLocation();
  return <Navigate to={user ? homeFor(user) : `/login${location.search}`} replace />;
}

function NotFound() {
  const { user } = useAuth();
  return (
    <div className="not-found">
      <div>
        <h1>404</h1>
        <p className="text-2 mb-2">This page doesn’t exist.</p>
        <Link className="btn btn-primary" to={homeFor(user)}>Go home</Link>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => { warmUp(); }, []);
  return (
    <AuthProvider>
      <FeatureProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

              <Route element={<RequireAuth role="admin" />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>

              <Route element={<RequireAuth role="teacher" />}>
                <Route path="/dashboard" element={<TeacherDashboard />} />
                <Route path="/session/:id" element={<LiveSession />} />
                <Route path="/courses" element={<Feature flag="teacher.page_courses" what="The courses page"><Courses /></Feature>} />
                <Route path="/courses/:id" element={<Feature flag="teacher.page_courses" what="The courses page"><CourseDetail /></Feature>} />
                <Route path="/reports" element={<Feature flag="teacher.page_reports" what="The reports page"><Reports /></Feature>} />
              </Route>

              <Route element={<RequireAuth role="student" />}>
                <Route path="/student" element={<StudentHome />} />
                <Route path="/scan" element={<Feature flag="student.page_scan" what="Attendance scanning"><Scanner /></Feature>} />
                <Route path="/history" element={<Feature flag="student.page_history" what="Attendance history"><History /></Feature>} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </FeatureProvider>
    </AuthProvider>
  );
}

export default App;
