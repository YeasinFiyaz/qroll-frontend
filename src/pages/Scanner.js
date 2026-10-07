import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { Alert, Spinner, fmtTime } from '../components/ui';
import API, { errorMessage } from '../api/axios';

const canDetect = typeof window !== 'undefined' && 'BarcodeDetector' in window;

// Location is attached only if the student already allowed it — we never block on a prompt.
async function quickLocation() {
  try {
    if (!navigator.geolocation || !navigator.permissions) return {};
    const p = await navigator.permissions.query({ name: 'geolocation' });
    if (p.state !== 'granted') return {};
    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({}),
        { timeout: 2500, maximumAge: 60000 }
      );
    });
  } catch (e) {
    return {};
  }
}

function Scanner() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const linkToken = params.get('t');

  const [result, setResult] = useState(null); // { ok, title, text }
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);
  const autoRan = useRef(false);

  const stopCamera = useCallback(() => {
    if (loopRef.current) clearTimeout(loopRef.current);
    loopRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const submit = useCallback(async (token) => {
    if (!token) return;
    setBusy(true);
    setResult(null);
    try {
      const loc = await quickLocation();
      const res = await API.post('/attend/scan', { token, ...loc });
      setResult({ ok: true, title: 'You’re marked present!', text: res.data.message, time: res.data.marked_at, course: res.data.course_code });
      if (navigator.vibrate) navigator.vibrate(120);
    } catch (err) {
      const status = err.response?.status;
      setResult({
        ok: status === 409,
        already: status === 409,
        title: status === 409 ? 'Already checked in' : status === 410 ? 'Session has ended' : 'Could not mark attendance',
        text: errorMessage(err, 'Something went wrong, please try again'),
      });
    } finally {
      setBusy(false);
      setCode('');
    }
  }, []);

  // Opened from a QR link (/scan?t=...): mark attendance straight away.
  useEffect(() => {
    if (linkToken && !autoRan.current) {
      autoRan.current = true;
      submit(linkToken);
      navigate('/scan', { replace: true });
    }
  }, [linkToken, submit, navigate]);

  const startCamera = async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, audio: false,
      });
      streamRef.current = stream;
      setCamOn(true);
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      // eslint-disable-next-line no-undef
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const codes = await detector.detect(video);
          if (codes.length) {
            stopCamera();
            submit(codes[0].rawValue);
            return;
          }
        } catch (e) { /* frame not ready */ }
        loopRef.current = setTimeout(tick, 250);
      };
      tick();
    } catch (err) {
      stopCamera();
      setCamError(err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser settings, or use your phone’s camera app.'
        : 'Could not open the camera on this device.');
    }
  };

  if (busy) {
    return (
      <main className="page narrow">
        <div className="card result">
          <div className="big-icon tone-brand"><Spinner large /></div>
          <h2>Marking your attendance…</h2>
          <p>Just a moment.</p>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="page narrow">
        <div className="card result">
          <div className={`big-icon ${result.ok ? 'tone-success' : 'tone-danger'}`}>
            <Icon name={result.ok ? 'check' : 'x'} size={46} stroke={3} />
          </div>
          <h2>{result.title}</h2>
          <p>{result.text}</p>
          {result.time && <p className="muted small">{fmtTime(result.time)} · {new Date(result.time).toLocaleDateString()}</p>}
          <div className="row wrap mt-3" style={{ justifyContent: 'center' }}>
            <Link to="/student" className="btn btn-primary"><Icon name="home" /> Go to home</Link>
            <button className="btn btn-secondary" onClick={() => setResult(null)}><Icon name="scan" /> {result.ok ? 'Scan another' : 'Try again'}</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">Check in</div>
          <h1>Scan attendance QR</h1>
          <p>Point your camera at the QR code your teacher is showing.</p>
        </div>
      </div>

      <div className="card">
        <div className="scanner">
          <video ref={videoRef} playsInline muted style={{ display: camOn ? 'block' : 'none' }} />
          {camOn ? (
            <>
              <div className="frame" />
              <div className="laser" />
            </>
          ) : (
            <div className="scanner-placeholder">
              <div>
                <Icon name="camera" size={44} />
                {canDetect ? (
                  <>
                    <p className="mt-1 mb-2">Tap below to open your camera</p>
                    <button className="btn btn-primary btn-lg" onClick={startCamera}><Icon name="scan" /> Start scanning</button>
                  </>
                ) : (
                  <p className="mt-1 small" style={{ maxWidth: 280 }}>
                    Open your phone’s <b>Camera app</b> and point it at the QR — it opens QRoll and marks you present automatically.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {camOn && (
          <div className="row mt-2" style={{ justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={stopCamera}><Icon name="x" /> Stop camera</button>
          </div>
        )}
        {camError && <div className="mt-2"><Alert>{camError}</Alert></div>}

        <div className="divider">or enter the code</div>
        <form onSubmit={(e) => { e.preventDefault(); submit(code.trim()); }}>
          <div className="field">
            <input
              className="input mono" placeholder="Paste the session link or code"
              value={code} onChange={(e) => setCode(e.target.value)}
            />
            <span className="hint">Your teacher can share the link from their screen.</span>
          </div>
          <button className="btn btn-primary btn-block" disabled={!code.trim()}><Icon name="check" /> Mark attendance</button>
        </form>
      </div>
    </main>
  );
}

export default Scanner;
