import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { Alert, Loading, Spinner, useFetch, useToast } from '../components/ui';
import API, { errorMessage } from '../api/axios';
import { useFeatures } from '../features';

// Switches grouped the way they appear in the app.
const GROUPS = [
  { title: 'Teacher dashboard', icon: 'home', keys: ['teacher.stats', 'teacher.running_sessions', 'teacher.start_attendance', 'teacher.recent_sessions', 'teacher.my_courses', 'teacher.needs_attention'] },
  { title: 'Teacher pages & actions', icon: 'users', keys: ['teacher.page_courses', 'teacher.page_reports', 'teacher.can_create_course', 'teacher.can_delete_course', 'teacher.can_email_alerts'] },
  { title: 'Student home', icon: 'cap', keys: ['student.overall', 'student.my_courses', 'student.recent_checkins', 'student.low_warning'] },
  { title: 'Student pages', icon: 'scan', keys: ['student.page_scan', 'student.page_history'] },
  { title: 'Sign-up', icon: 'lock', keys: ['global.registration', 'global.registration_teacher'] },
];

function Toggle({ on, onChange, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={`toggle${on ? ' on' : ''}`} onClick={() => onChange(!on)} disabled={disabled}>
      <span className="knob" />
    </button>
  );
}

function AdminSettings() {
  const toast = useToast();
  const { reload: reloadFeatures } = useFeatures();
  const { data, loading, error } = useFetch(async () => {
    const [s, l] = await Promise.all([API.get('/settings'), API.get('/settings/labels')]);
    return { features: s.data.features, labels: l.data };
  }, []);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setDraft(data.features); }, [data]);

  const dirty = data && draft && Object.keys(draft).some((k) => draft[k] !== data.features[k]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await API.put('/settings/features', { features: draft });
      setDraft(res.data.features);
      data.features = res.data.features;
      toast('Settings saved — changes apply to everyone immediately');
      reloadFeatures();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const setGroup = (keys, value) => setDraft({ ...draft, ...Object.fromEntries(keys.map((k) => [k, value])) });

  return (
    <main className="page narrow">
      <div className="page-head">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>Feature switches</h1>
          <p>Turn any part of QRoll on or off for teachers and students. Off = hidden and blocked. You always see everything.</p>
        </div>
      </div>

      {loading && <Loading />}
      {error && <Alert>{errorMessage(error)}</Alert>}

      {draft && (
        <>
          <div className="stack">
            {GROUPS.map((g) => {
              const allOn = g.keys.every((k) => draft[k]);
              return (
                <div key={g.title} className="card">
                  <div className="card-head">
                    <h3><Icon name={g.icon} /> {g.title}</h3>
                    <button className="btn btn-sm btn-ghost" onClick={() => setGroup(g.keys, !allOn)}>{allOn ? 'Turn all off' : 'Turn all on'}</button>
                  </div>
                  <div className="list">
                    {g.keys.map((k) => (
                      <div key={k} className="list-item">
                        <div className="grow">
                          <div className="title">{data.labels[k] || k}</div>
                          <div className="meta mono">{k}</div>
                        </div>
                        <span className={`badge ${draft[k] ? 'success' : 'danger'}`}>{draft[k] ? 'Visible' : 'Hidden'}</span>
                        <Toggle on={!!draft[k]} onChange={(v) => setDraft({ ...draft, [k]: v })} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="savebar">
            <span className="small text-2">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
            <div className="row">
              <button className="btn btn-secondary" onClick={() => setDraft(data.features)} disabled={!dirty || saving}>Discard</button>
              <button className="btn btn-primary" onClick={save} disabled={!dirty || saving}>{saving ? <Spinner /> : <Icon name="check" />} Save changes</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default AdminSettings;
