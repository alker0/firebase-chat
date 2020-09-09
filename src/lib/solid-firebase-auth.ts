import { User } from 'firebase';
import { createState } from 'solid-js';

export type UserState = User | null;

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
  setSessionState('currentUser', user);
};
