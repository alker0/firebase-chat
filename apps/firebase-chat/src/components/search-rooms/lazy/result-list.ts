import { createLazyComponent } from '@components/common/util/lazy-component-creator';
import type { SearchResultListContext } from '../result-list';

export type { SearchResultListContext };

export const createLazyResultList = (context: SearchResultListContext) => {
  return createLazyComponent(
    () => import('../result-list'),
    (resolved) => resolved.createSearchResultListComponent(context),
  );
};
