import {
  createState,
  createRoot,
  batch,
  reconcile,
  assignProps,
} from 'solid-js';
import { FirebaseAuth, FirebaseUser } from '../typings/firebase-sdk';

export type UserState = FirebaseUser | null;

export interface SessionStateWhenLoggedIn {
  readonly currentUser: FirebaseUser;
  readonly isLoggedIn: true;
  readonly currentUserOrAnounymous: () => FirebaseUser;
}

export interface SessionStateWhenLoggedOut {
  readonly currentUser: null;
  readonly isLoggedIn: false;
  readonly currentUserOrAnounymous: (auth: FirebaseAuth) => Promise<UserState>;
}

export type SessionState = SessionStateWhenLoggedIn | SessionStateWhenLoggedOut;
export type SessionStateWithoutAnonymous =
  | Omit<SessionStateWhenLoggedIn, 'currentUserOrAnounymous'>
  | Omit<SessionStateWhenLoggedOut, 'currentUserOrAnounymous'>;

export const [sessionState, setSessionState] = createRoot(() => {
  const [
    sessionStateWithoutAnonymous,
    setState,
  ] = createState<SessionStateWithoutAnonymous>({
    currentUser: null,
    isLoggedIn: false,
  });
  return [
    assignProps(sessionStateWithoutAnonymous, {
      get currentUserOrAnounymous(): SessionState['currentUserOrAnounymous'] {
        if (sessionStateWithoutAnonymous.isLoggedIn) {
          return () => sessionStateWithoutAnonymous.currentUser;
        } else {
          return async (auth) => (await auth.signInAnonymously()).user;
        }
      },
    }) as SessionState,
    setState,
  ];
});

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
