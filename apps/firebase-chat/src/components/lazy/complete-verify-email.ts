import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import { CompleteVerifyEmail } from '../complete-verify-email';

export const createLazyCompleteVerifyEmail = (
  context: CompleteVerifyEmail.Context,
) => {
  return createLazyComponent(
    () => import('../complete-verify-email'),
    (resolved) => resolved.CompleteVerifyEmail.createComponent(context),
  );
};
