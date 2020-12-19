import type FirebaseType from 'firebase';
import { createState, createRoot } from 'solid-js';

export type UserState = FirebaseType.User | null;

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
