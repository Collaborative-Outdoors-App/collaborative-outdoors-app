import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { getProfile, saveProfile, getCachedProfile } from '../firebase/profile';

const AuthContext = createContext({ 
  user: null,
  checking: true,
  refreshUser: () => {},
  profile: {},
  profileReady: false,
  saveMyProfile: async () => {},});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [, setVersion] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const refreshUser = () => setVersion((v) => v + 1);

  useEffect(() => {
    if (!auth) {
      setChecking(false);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileReady(false);
      return;
    }
    let cancelled = false;

    getCachedProfile(user.uid).then((cached) => {
    if (!cancelled && cached) {
       setProfile(cached);
       setProfileReady(true);
      }
    });
    getProfile(user.uid).then((p) => {
      if (!cancelled) {
        setProfile(p ?? {});
        setProfileReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const saveMyProfile = async (data) => {
    const merged = await saveProfile(user.uid, data);
    setProfile(merged);
    return merged;
  };
  

  return (
    <AuthContext.Provider value={{ user, checking, refreshUser, profile: profile ?? {}, profileReady, saveMyProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
