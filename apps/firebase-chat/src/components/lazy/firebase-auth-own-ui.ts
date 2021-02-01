import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import type { FirebaseAuthOwnUI } from '../firebase-auth-own-ui';

export type { FirebaseAuthOwnUI };

export const createLazyAuthUI = (context?: FirebaseAuthOwnUI.Context) => {
  return createLazyComponent(
    () => import('./../firebase-auth-own-ui'),
    (resolved) => resolved.FirebaseAuthOwnUI.createComponent(context),
  );
};
