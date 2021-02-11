import { createState, createRoot, batch, reconcile } from 'solid-js';
import { FirebaseAuth, FirebaseUser } from '../typings/firebase-sdk';

export type UserState = FirebaseUser | null;

export interface SessionStateWhenLoggedIn {
  readonly currentUser: FirebaseUser;
  readonly isLoggedIn: true;
}

export interface SessionStateWhenLoggedOut {
  readonly currentUser: null;
  readonly isLoggedIn: false;
}

export type SessionState = SessionStateWhenLoggedIn | SessionStateWhenLoggedOut;

export const [sessionState, setSessionState] = createRoot(() =>
  createState<SessionState>({
    currentUser: null,
    isLoggedIn: false,
  }),
);

export const sessionStateChangedHandler = (user: UserState) => {
  if (user && !user.isAnonymous && !user.emailVerified) {
    user
      .delete()
      .then(() => console.log('User is deleted'))
      .catch(console.log);
  } else {
    batch(() => {
      setSessionState('currentUser', reconcile(user));
      setSessionState('isLoggedIn', Boolean(user));
    });
  }
};

export async function getCurrentUserOrSignInAnonymously(auth: FirebaseAuth) {
  return auth.currentUser ?? (await auth.signInAnonymously()).user;
}
