import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '../components/Icon';
import { Brand } from '../components/Navbar';
import { ServerBanner } from '../components/ui';

const FEATURES = [
  { icon: 'zap', title: 'Attendance in seconds', text: 'Show a QR, students scan, done.' },
  { icon: 'clock', title: 'Live, expiring sessions', text: 'Codes auto-expire so no one marks from home.' },
  { icon: 'bars', title: 'Reports & alerts', text: 'Percentages, CSV export and low-attendance emails.' },
];

function AuthLayout({ children }) {
  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}><ServerBanner /></div>
      <div className="auth">
        <aside className="auth-art">
          <div className="brand"><span className="brand-mark"><Icon name="qr" size={19} stroke={2.4} /></span>QRoll</div>
          <div>
            <h2>Smart attendance, without the roll call.</h2>
            <p className="lead">QRoll turns every class into a one-scan check-in — fast for teachers, effortless for students.</p>
            <div className="feature-list">
              {FEATURES.map((f) => (
                <div className="feature" key={f.title}>
                  <div className="fi"><Icon name={f.icon} /></div>
                  <div><b>{f.title}</b><span>{f.text}</span></div>
                </div>
              ))}
            </div>
          </div>
          <p style={{ opacity: 0.7, fontSize: 13 }}>© {new Date().getFullYear()} QRoll · Smart Attendance System</p>
          <div className="qr-float" aria-hidden="true">
            <QRCodeSVG value={window.location.origin} size={122} fgColor="#3f30d9" />
          </div>
        </aside>
        <main className="auth-form">
          <div className="auth-card">
            <div className="auth-mobile-brand"><Brand /></div>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

export default AuthLayout;
