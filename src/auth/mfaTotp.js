import { multiFactor, TotpMultiFactorGenerator, getMultiFactorResolver } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';


export const getEnrolledFactors = (user) => multiFactor(user).enrolledFactors;

export async function startTotpEnrollment(user) {
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  const uri = secret.generateQrCodeUrl(user.email, 'Collaborative Outdoors');
  return { secret, uri, key: secret.secretKey };
}

export async function finishTotpEnrollment(user, secret, code) {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
  await multiFactor(user).enroll(assertion, 'Authenticator app');
}

export const removeFactor = (user, factor) => multiFactor(user).unenroll(factor);

let pending = null; 

export const isMfaRequired = (e) => e?.code === 'auth/multi-factor-auth-required';

export function startSignInVerification(error) {
  const resolver = getMultiFactorResolver(auth, error);
  const hint = resolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  if (!hint) throw new Error('No authenticator app is set up on this account');
  pending = { resolver, hint };
}

export async function finishSignIn(code) {
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(pending.hint.uid, code);
  const result = await pending.resolver.resolveSignIn(assertion);
  pending = null;
  return result.user;
}