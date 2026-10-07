import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import API from './api/axios';
import { useAuth } from './auth';

// Feature switches set by the admin. Unknown keys default to "on".
const FeatureContext = createContext({ features: {}, isOn: () => true, loaded: false, reload: () => {} });

export function FeatureProvider({ children }) {
  const { user } = useAuth();
  const [features, setFeatures] = useState({});
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await API.get('/settings');
      setFeatures(res.data.features || {});
    } catch (e) { /* keep previous */ } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { reload(); }, [reload, user?.id]);

  const value = useMemo(() => ({
    features,
    loaded,
    reload,
    // Admins always see everything.
    isOn: (key) => (user?.role === 'admin' ? true : features[key] !== false),
  }), [features, loaded, reload, user]);

  return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
}

export function useFeatures() {
  return useContext(FeatureContext);
}
