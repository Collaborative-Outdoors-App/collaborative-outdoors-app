import { useAuth } from './authContext';

export function useCurrentUser() {
  const { user, checking, profile, profileReady, saveMyProfile } = useAuth();

  if (!user) {
    return {
      loading: checking, isSignedIn: false, ready: false, uid: null, id: null,
      email: '', name: '', firstName: '', lastName: '',
      dateOfBirth: null, weightKg: null, emergencyContact: null, save: async () => {},
    };
  }

  const [fallbackFirst = '', ...rest] = (user.displayName || '').split(' ');

  return {
    loading: false,
    isSignedIn: true,
    ready: profileReady,
    uid: user.uid,
    id: user.uid,
    email: user.email,
    name: user.displayName || user.email,
    firstName: profile.firstName || fallbackFirst,
    lastName: profile.lastName || rest.join(' '),
    dateOfBirth: profile.dateOfBirth || null,
    weightKg: profile.weightKg ?? null,
    emergencyContact: profile.emergencyContact || null,
    save: saveMyProfile,
  };
}