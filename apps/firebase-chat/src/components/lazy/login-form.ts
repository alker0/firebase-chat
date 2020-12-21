import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import { LoginForm } from '../login-form';

export const createLazyLoginForm = (context: LoginForm.Context) => {
  return createLazyComponent(
    () => import('../login-form'),
    (resolved) => resolved.LoginForm.createComponent(context),
  );
};
