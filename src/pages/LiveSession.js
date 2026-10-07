import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import Icon from '../components/Icon';
import SessionRoster from '../components/SessionRoster';
import {
  Loading, Alert, ConfirmModal, Ring, Empty, useToast, fmtTime, initials,
} from '../components/ui';
import API, { errorMessage } from '../api/axios';

function pad(n) { return String(n).padStart(2, '0'); }

function LiveSession() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [session, setSession] = useState(location.state?.session || null);
  const [loading, setLoading] = useState(!location.state?.session);
  const [error, setError] = useState('');
  const [live, setLive] = useState(null);
  const [offset, setOffset] = useState(() => {
    const s = location.state?.session;
    return s?.server_now ? new Date(s.server_now).getTime() - Date.now() : 0;
  });
  const [now, setNow] = useState(Date.now());
  const [ended, setEnded] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const seen = useRef(new Set());
  const [fresh, setFresh] = useState(new Set());
  const stageRef = useRef(null);

  // Load session details when opened directly (e.g. after a page refresh).
  useEffect(() => {
    if (session) return;
    let cancelled = false;
    API.get('/sessions/active')
      .then((res) => {
        if (cancelled) return;
        const s = res.data.find((x) => String(x.session_id) === String(id));
        if (s) {
          setSession(s);
          setOffset(new Date(s.server_now).getTime() - Date.now());
        } else {
          setEnded(true);
        }
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, session]);

  const poll = useCallback(async () => {
    try {
      const res = await API.get(`/sessions/${id}/live`, { noRetry: true });
      const d = res.data;
      setLive(d);
      setOffset(new Date(d.server_now).getTime() - Date.now());
      if (!d.is_live) setEnded(true);
      const newcomers = d.students.filter((s) => !seen.current.has(s.user_id));
      if (seen.current.size > 0 && newcomers.length) {
        setFresh(new Set(newcomers.map((s) => s.user_id)));
      }
      d.students.forEach((s) => seen.current.add(s.user_id));
    } catch (err) {
      if (err.response?.status === 404) setError('Session not found');
    }
  }, [id]);

  useEffect(() => {
    poll();
    if (ended) return undefined;
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [poll, ended]);

  useEffect(() => {
    if (ended) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ended]);

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const expiresAt = session ? new Date(live?.expires_at || session.expires_at).getTime() : 0;
  const remaining = Math.max(0, Math.round((expiresAt - (now + offset)) / 1000));
  const startedAt = session?.created_at ? new Date(session.created_at).getTime() : expiresAt - 10 * 60000;
  const totalSecs = Math.max(1, Math.round((expiresAt - startedAt) / 1000));

  useEffect(() => {
    if (session && !ended && remaining === 0 && live) {
      setEnded(true);
      poll();
    }
  }, [remaining, session, ended, live, poll]);

  const scanUrl = session ? `${window.location.origin}/scan?t=${session.token}` : '';

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stageRef.current?.requestFullscreen();
    } catch (e) { /* not supported */ }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(scanUrl);
      toast('Scan link copied — share it with students');
    } catch (e) {
      toast('Could not copy automatically', 'error');
    }
  };

  const closeSession = async () => {
    setClosing(true);
    try {
      await API.put(`/sessions/${id}/close`);
      setEnded(true);
      setConfirmClose(false);
      toast('Session closed');
      poll();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setClosing(false);
    }
  };

  if (loading) return <main className="page"><Loading label="Opening session…" /></main>;

  const students = live?.students || [];
  const enrolled = live?.enrolled_count ?? 0;
  const pct = enrolled ? Math.round((students.length * 100) / enrolled) : 0;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ marginLeft: -10 }}>
            <Icon name="arrowLeft" size={16} /> Dashboard
          </button>
          <h1 className="mt-1">{session ? `${session.course_code} · ${session.course_name}` : `Session #${id}`}</h1>
          <p>
            {ended
              ? <span className="badge danger">Ended</span>
              : <span className="badge success"><span className="live-dot" /> Live — students can scan now</span>}
          </p>
        </div>
        <div className="row wrap">
          {!ended && session && (
            <>
              <button className="btn btn-secondary" onClick={toggleFullscreen}><Icon name="maximize" /> Projector mode</button>
              <button className="btn btn-danger-soft" onClick={() => setConfirmClose(true)}><Icon name="stop" /> End session</button>
            </>
          )}
          {ended && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowRoster(true)}><Icon name="users" /> Full roster</button>
              <Link className="btn btn-primary" to="/dashboard"><Icon name="play" /> New session</Link>
            </>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="live-grid">
        {!ended && session ? (
          <div ref={stageRef} className={`qr-stage${fullscreen ? ' fullscreen' : ''}`}>
            {fullscreen && <h2>{session.course_code} · Scan to mark attendance</h2>}
            <div className="qr-box">
              <QRCodeCanvas value={scanUrl} size={640} level="M" marginSize={1} />
            </div>
            <div>
              <div className={`countdown${remaining <= 60 ? ' low' : ''}`}>
                {pad(Math.floor(remaining / 60))}:{pad(remaining % 60)}
              </div>
              <div className="muted small mt-1">remaining · closes at {fmtTime(expiresAt)}</div>
            </div>
            {!fullscreen && (
              <>
                <p className="text-2 small" style={{ maxWidth: 380 }}>
                  Students scan this QR with their phone camera or the QRoll app. It stops working automatically when the timer ends.
                </p>
                <div className="token-box">
                  <code>{scanUrl}</code>
                  <button className="btn btn-sm btn-secondary" onClick={copyLink}><Icon name="copy" size={15} /> Copy</button>
                </div>
              </>
            )}
            {fullscreen && (
              <div className="row" style={{ gap: 18, fontSize: 22, fontWeight: 700 }}>
                <Icon name="users" size={26} /> {students.length} checked in
                <button className="btn btn-secondary" onClick={toggleFullscreen}><Icon name="minimize" /> Exit</button>
              </div>
            )}
          </div>
        ) : (
          <div className="qr-stage">
            <div className="empty-icon" style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--success-soft)', color: 'var(--success)', display: 'grid', placeItems: 'center' }}>
              <Icon name="checkCircle" size={36} />
            </div>
            <h2>Session finished</h2>
            <p className="text-2">{students.length} of {enrolled} enrolled students checked in.</p>
            <Ring value={pct} size={150} label="attendance" />
            <button className="btn btn-secondary" onClick={() => setShowRoster(true)}>
              <Icon name="users" /> See who was absent
            </button>
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <h3><Icon name="users" /> Checked in</h3>
            <span className="badge brand">{students.length}{enrolled ? ` / ${enrolled}` : ''}</span>
          </div>
          {enrolled > 0 && (
            <div className="mb-2">
              <div className="progress" style={{ height: 10 }}>
                <span style={{ width: `${Math.min(100, pct)}%`, background: 'var(--gradient)' }} />
              </div>
              <div className="muted xs mt-1">{pct}% of enrolled students</div>
            </div>
          )}
          {students.length === 0 ? (
            <Empty icon="scan" title="Waiting for scans…" text="Names appear here the moment students scan." />
          ) : (
            <div className="list" style={{ maxHeight: 520, overflowY: 'auto' }}>
              {students.map((s) => (
                <div key={s.user_id} className={`list-item${fresh.has(s.user_id) ? ' arrival' : ''}`}>
                  <span className="avatar">{initials(s.name)}</span>
                  <div className="grow">
                    <div className="title truncate">{s.name}</div>
                    <div className="meta truncate">{s.email}</div>
                  </div>
                  <span className="muted xs">{fmtTime(s.marked_at)}</span>
                </div>
              ))}
            </div>
          )}
          {!ended && session && remaining > 0 && totalSecs > 0 && (
            <p className="muted xs mt-2"><Icon name="refresh" size={12} /> Updates automatically every 3 seconds</p>
          )}
        </div>
      </div>

      {confirmClose && (
        <ConfirmModal
          title="End this session?"
          text="The QR code will stop working immediately. Students who haven’t scanned will be marked absent."
          confirmLabel="End session" danger busy={closing}
          onConfirm={closeSession} onClose={() => setConfirmClose(false)}
        />
      )}
      {showRoster && <SessionRoster sessionId={id} onClose={() => setShowRoster(false)} />}
    </main>
  );
}

export default LiveSession;
