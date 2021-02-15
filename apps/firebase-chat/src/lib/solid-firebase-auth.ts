import { createState, createRoot, batch, reconcile } from 'solid-js';
import { FirebaseAuth, FirebaseUser } from '../typings/firebase-sdk';

export type UserState = FirebaseUser | null;

export interface SessionStateWhenActualLoggingIn {
  readonly currentUser: FirebaseUser;
  readonly isLoggedIn: true;
  readonly isActuallyLoggedIn: true;
}

export interface SessionStateWhenAnonymousLoggingIn {
  readonly currentUser: FirebaseUser;
  readonly isLoggedIn: true;
  readonly isActuallyLoggedIn: false;
}

export interface SessionStateWhenLoggingOut {
  readonly currentUser: null;
  readonly isLoggedIn: false;
  readonly isActuallyLoggedIn: false;
}

export type SessionState =
  | SessionStateWhenActualLoggingIn
  | SessionStateWhenAnonymousLoggingIn
  | SessionStateWhenLoggingOut;

export const [sessionState, setSessionState] = createRoot(() =>
  createState<SessionState>({
    currentUser: null,
    isLoggedIn: false,
    isActuallyLoggedIn: false,
  }),
);

export const sessionStateChangedHandler = (user: UserState) => {
  if (user) {
    const isEmailVerified = user.emailVerified;
    if (!user.isAnonymous && !isEmailVerified) {
      user
        .delete()
        .then(() => console.log('User is deleted'))
        .catch(console.error);
    } else {
      batch(() => {
        setSessionState('currentUser', reconcile(user as UserState));
        setSessionState({
          isLoggedIn: true,
          isActuallyLoggedIn: isEmailVerified,
        });
      });
    }
  } else {
    setSessionState({
      currentUser: null,
      isLoggedIn: false,
      isActuallyLoggedIn: false,
    });
  }
};

export async function getCurrentUserOrSignInAnonymously(auth: FirebaseAuth) {
  return auth.currentUser ?? (await auth.signInAnonymously()).user;
}
