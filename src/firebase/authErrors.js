export function authMessage(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/requires-recent-login':
      return 'Please log in again to do this.';
    case 'auth/network-request-failed':
      return "You're offline. Signing in needs a connection. If you've signed in on this phone before, just reopen the app.";
    default:
      return 'Something went wrong. Please try again.';
  }
}