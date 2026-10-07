import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth, homeFor } from '../auth';

// Shown in place of a page the administrator has switched off.
function Disabled({ what = 'This page' }) {
  const { user } = useAuth();
  return (
    <main className="page narrow">
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div className="empty-icon" style={{ margin: '0 auto 14px' }}><Icon name="lock" size={26} /></div>
        <h2 style={{ fontSize: 22 }}>{what} is currently unavailable</h2>
        <p className="text-2 mt-1">The administrator has turned this off for now. Please check back later.</p>
        <Link to={homeFor(user)} className="btn btn-primary mt-3"><Icon name="home" /> Go home</Link>
      </div>
    </main>
  );
}

export default Disabled;
