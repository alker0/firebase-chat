import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import { FirebaseAuthUI } from '@components/common/domain/firebase-auth-ui';

export const createLazyFirebaseAuthUI = (context: FirebaseAuthUI.Context) => {
  return createLazyComponent(
    () => import('@components/common/domain/firebase-auth-ui'),
    (resolved) => resolved.FirebaseAuthUI.createComponent(context),
  );
};
