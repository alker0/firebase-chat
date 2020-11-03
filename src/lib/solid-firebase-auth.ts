import type FirebaseType from 'firebase';
import { createState } from 'solid-js';

export type UserState = FirebaseType.User | null;

export interface SessionState {
  readonly isLoggedIn: boolean;
  readonly currentUser: UserState;
}

export const [sessionState, setSessionState] = createState({
  currentUser: null as UserState,
  get isLoggedIn(): boolean {
    return Boolean(sessionState.currentUser);
  },
});

export const sessionStateChangedHandler = (user: UserState) => {
  if (user && !user.emailVerified) {
    user
      .delete()
      .then(() => console.log('User is deleted'))
      .catch(console.log);
  } else {
    setSessionState('currentUser', user);
  }
};
