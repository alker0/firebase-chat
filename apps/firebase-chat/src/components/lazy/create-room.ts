import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import { CreateRoom } from '../create-room';

export const createLazyCreateRoom = (context: CreateRoom.Context) => {
  return createLazyComponent(
    () => import('../create-room'),
    (resolved) => resolved.CreateRoom.createComponent(context),
  );
};
