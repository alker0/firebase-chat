import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import type { SearchRooms } from '../search-rooms';

export type { SearchRooms };

export const createLazySearchRooms = (context: SearchRooms.Context) => {
  return createLazyComponent(
    () => import('../search-rooms'),
    (resolved) => resolved.SearchRooms.createComponent(context),
  );
};
