import { createLazyComponent } from '@components/common/util/lazy-component-creater';
import { FirebaseAuthOwnUI } from '../firebase-auth-own-ui';

export const createLazyAuthUI = (context?: FirebaseAuthOwnUI.Context) => {
  return createLazyComponent(
    () => import('./../firebase-auth-own-ui'),
    (resolved) => resolved.FirebaseAuthOwnUI.createComponent(context),
  );
};
