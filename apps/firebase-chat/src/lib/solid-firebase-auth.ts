import { createState, createRoot } from 'solid-js';
import { FirebaseUser } from '@typings/firebase-sdk';

export type UserState = FirebaseUser | null;

export interface SesstionState {
  currentUser: UserState;
  readonly isLoggedIn: boolean;
}

export const [sessionState, setSessionState] = createRoot(() => {
  const sessionStateAccessor = createState<SesstionState>({
    currentUser: null as UserState,
    get isLoggedIn(): boolean {
      return Boolean((this as SesstionState).currentUser);
    },
  });
  return sessionStateAccessor;
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
