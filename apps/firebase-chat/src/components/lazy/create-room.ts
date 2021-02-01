import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import type { CreateRoom } from '../create-room';

export type { CreateRoom };

export const createLazyCreateRoom = (context: CreateRoom.Context) => {
  return createLazyComponent(
    () => import('../create-room'),
    (resolved) => resolved.CreateRoom.createComponent(context),
  );
};
