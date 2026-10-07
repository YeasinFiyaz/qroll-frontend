import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../auth';
import { ServerBanner, initials } from './ui';

const TEACHER_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/courses', label: 'Courses', icon: 'book' },
  { to: '/reports', label: 'Reports', icon: 'bars' },
];

const STUDENT_LINKS = [
  { to: '/student', label: 'Home', icon: 'home' },
  { to: '/scan', label: 'Scan', icon: 'scan', fab: true },
  { to: '/history', label: 'History', icon: 'history' },
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
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';
  const links = isStudent ? STUDENT_LINKS : TEACHER_LINKS;

  return (
    <>
      <ServerBanner />
      <header className="topbar">
        <div className="topbar-inner">
          <Brand to={isStudent ? '/student' : '/dashboard'} />
          <nav className="nav">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}>
                <Icon name={l.icon} size={17} /> {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="row">
            <button className="user-chip" onClick={() => navigate('/profile')} title="Profile">
              <span className="who"><b>{user?.name}</b><span>{user?.role}</span></span>
              <span className="avatar">{initials(user?.name)}</span>
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
          <NavLink key={l.to} to={l.to} className={l.fab ? 'fab' : undefined}>
            {l.fab
              ? <span className="fab-circle"><Icon name={l.icon} size={24} /></span>
              : <Icon name={l.icon} size={22} />}
            <span>{l.label}</span>
          </NavLink>
        ))}
        <NavLink to="/profile">
          <Icon name="user" size={22} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </>
  );
}

export default Navbar;
