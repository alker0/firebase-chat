import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import type { EnterModalContext } from '../enter-modal';

export type { EnterModalContext };

export const createLazyEnterModal = (context: EnterModalContext) => {
  return createLazyComponent(
    () => import('../enter-modal'),
    (resolved) => resolved.createEnterModalComponent(context),
  );
};
