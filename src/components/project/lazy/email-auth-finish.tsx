import { createLazyComponent } from '@components/common/util/lazy-component-creater';

export const createLazyEmailAuthFinish = () => {
  return createLazyComponent(
    () => import('../email-auth-finish'),
    (resolved) => resolved.EmailAuthFinish.createComponent(),
  );
};
