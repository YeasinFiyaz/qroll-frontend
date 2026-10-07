import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../auth';
import { useFeatures } from '../features';
import { ServerBanner, initials } from './ui';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Admin', icon: 'shield', end: true },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/courses', label: 'Courses', icon: 'book' },
  { to: '/reports', label: 'Reports', icon: 'bars' },
  { to: '/admin/settings', label: 'Settings', icon: 'edit' },
];

const TEACHER_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/courses', label: 'Courses', icon: 'book', flag: 'teacher.page_courses' },
  { to: '/reports', label: 'Reports', icon: 'bars', flag: 'teacher.page_reports' },
];

const STUDENT_LINKS = [
  { to: '/student', label: 'Home', icon: 'home' },
  { to: '/scan', label: 'Scan', icon: 'scan', fab: true, flag: 'student.page_scan' },
  { to: '/history', label: 'History', icon: 'history', flag: 'student.page_history' },
];

export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand">
      <span className="brand-mark"><Icon name="qr" size={19} stroke={2.4} /></span>
      QRoll
    </Link>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const { isOn } = useFeatures();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const links = (isAdmin ? ADMIN_LINKS : isStudent ? STUDENT_LINKS : TEACHER_LINKS)
    .filter((l) => !l.flag || isOn(l.flag));
  const home = isAdmin ? '/admin' : isStudent ? '/student' : '/dashboard';

  return (
    <>
      <ServerBanner />
      <header className="topbar">
        <div className="topbar-inner">
          <Brand to={home} />
          <nav className="nav">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}>
                <Icon name={l.icon} size={17} /> {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="row">
            <button className="user-chip" onClick={() => navigate('/profile')} title="Profile">
              <span className="who"><b>{user?.name}</b><span>{user?.role}</span></span>
              <span className={`avatar${isAdmin ? ' admin' : ''}`}>{initials(user?.name)}</span>
            </button>
            <button
              className="icon-btn" title="Log out" aria-label="Log out"
              onClick={() => { logout(); navigate('/login'); }}
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </header>

      <nav className="bottom-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={l.fab ? 'fab' : undefined}>
            {l.fab
              ? <span className="fab-circle"><Icon name={l.icon} size={24} /></span>
              : <Icon name={l.icon} size={22} />}
            <span>{l.label}</span>
          </NavLink>
        ))}
        {!isAdmin && (
          <NavLink to="/profile">
            <Icon name="user" size={22} />
            <span>Profile</span>
          </NavLink>
        )}
      </nav>
    </>
  );
}

export default Navbar;
