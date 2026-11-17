import { auth } from './firebaseConfig';

export async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  return user.getIdToken();
}