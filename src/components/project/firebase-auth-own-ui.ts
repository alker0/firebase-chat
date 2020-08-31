import { SignUpForm } from "@components/common/cirrus/domain/login-form-group";
import { createLazyComponent } from "@components/common/util/lazy-component-creater";

export const createLazyAuthUI = (context: SignUpForm.Context) => {
  return createLazyComponent(() => import('@components/common/cirrus/domain/login-form-group'), 'SignUpForm', context);
}
