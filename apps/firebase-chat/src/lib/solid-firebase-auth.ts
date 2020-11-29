import type FirebaseType from 'firebase';
import { createState, createRoot } from 'solid-js';

export type UserState = FirebaseType.User | null;

export const [sessionState, setSessionState] = createRoot(() => {
  const sessionStateAccessor = createState({
    currentUser: null as UserState,
    loginState: {
      get isLoggedIn(): boolean {
        return Boolean(sessionStateAccessor[0].currentUser);
      },
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
