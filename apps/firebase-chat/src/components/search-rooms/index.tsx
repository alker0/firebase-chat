import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import { buttonize } from '@components/common/util/component-utils';
import { Cirrus } from '@alker/cirrus-types';
import clsx, { Clsx } from 'clsx';
import {
  createSignal,
  createResourceState,
  createSelector,
  createEffect,
  createComputed,
  Suspense,
} from 'solid-js';
import { Switch, Match } from 'solid-js/web';
import { ENTER_MODAL_ID } from '@lib/constants';
import {
  SearchResults,
  SearchResultsKey,
  searchByMembersCount,
  searchByCreatedTime,
  createExecuteSearchFn,
  ExecuteSearchFunction,
  RoomRow,
} from '../../lib/search-rooms/search';
import {
  initialResultsInfo,
  createRefreshState,
  createSearchByNameHandler,
  createPageCountLogger,
} from '../../lib/search-rooms/utils';
import { logger } from '../../lib/logger';
import { createLazyResultList } from './lazy/result-list';
import { createLazyEnterModal, EnterModalContext } from './lazy/enter-modal';
import {
  FirebaseAuth,
  FirebaseDb,
  FirebaseDbServerValue,
} from '../typings/firebase-sdk';

const cn: Clsx<Cirrus> = clsx;

type SearchMode = 'Name' | 'Members Count' | 'Created Time';

function createImmidiateSearchersEffect(
  getSearchMode: () => SearchMode,
  executeFn: ExecuteSearchFunction,
  db: FirebaseDb,
) {
  createEffect((prevMode?: SearchMode) => {
    const currentMode = getSearchMode();

    logger.log(
      'Searchers Effect',
      'Mode',
      ...(currentMode === prevMode ? [] : [prevMode, '->']),
      currentMode,
    );

    if (prevMode === currentMode) return currentMode;

    switch (currentMode) {
      case 'Members Count':
        searchByMembersCount(executeFn, { db });
        break;
      case 'Created Time':
        searchByCreatedTime(executeFn, { db });
        break;
    }
    return currentMode;
  });
}

const InputField = BasicInputField.createComponent({
  fieldSize: 'small',
});

function createRefreshButton(sendRefreshSignal: () => void) {
  return function RefreshButton() {
    return (
      <button
        class={cn('btn-animated', 'mb-0')}
        onClick={() => sendRefreshSignal()}
      >
        Refresh
      </button>
    );
  };
}

export const SearchRooms = {
  createComponent: (context: SearchRooms.Context) => {
    const [searchMode, setSearchMode] = createSignal<SearchMode>('Name', true);
    const [searchPage, setSearchPage] = createSignal(1, true);
    const [
      refreshSignal,
      sendRefreshSignal,
    ] = createSignal<void | SearchResultsKey>();

    const modeSelector = createSelector<SearchMode, SearchMode>(searchMode);

    const [
      searchResults,
      loadSearchResults,
      setSearchResults,
    ] = createResourceState<SearchResults>({
      byName: initialResultsInfo,
      byMembersCount: initialResultsInfo,
      byCreatedTime: initialResultsInfo,
    });

    const [getSelectingRoomRow, setSelectingRoomRow] = createSignal<RoomRow>();

    const SearchResultList = createLazyResultList({
      searchResultsState: searchResults,
      enterModalId: ENTER_MODAL_ID,
      setSelectingRoomRow,
    });

    function SuspensedSearchResultList(
      props: Parameters<typeof SearchResultList>[0],
    ) {
      return (
        <Suspense fallback="Preparing...">
          <SearchResultList {...props} />
        </Suspense>
      );
    }

    const { auth, db, dbServerValue, redirectToChatPage } = context;

    const EnterModal = createLazyEnterModal({
      auth,
      db,
      enterModelId: ENTER_MODAL_ID,
      getSelectingRoomRow,
      redirectToChatPage,
      executeEnterOption: {
        dbServerValue,
      },
    });

    const RefreshButton = createRefreshButton(sendRefreshSignal);

    return () => {
      if (import.meta.env.MODE !== 'production') {
        createPageCountLogger(searchResults);
      }

      createComputed(() => {
        searchMode();
        setSearchPage(1);
      });

      const refreshState = createRefreshState(refreshSignal, setSearchResults);

      const executeFn = createExecuteSearchFn({
        getRequestedPage: searchPage,
        getRefreshPromise: () => refreshState.promise,
        getPreviousResults: searchResults,
        resultHandleFn: (targetKey, loadResultInfo) => {
          loadSearchResults({
            [targetKey]: loadResultInfo,
          });
        },
      });

      const searchByNameHandler = createSearchByNameHandler(
        executeFn,
        context.db,
      );

      createImmidiateSearchersEffect(searchMode, executeFn, context.db);

      return (
        <div class={cn('content')}>
          <h6 class={cn('u-text-center')}>Search Rooms</h6>
          <div class={cn('tab-container', 'tabs-fill')}>
            <ul>
              <li class={cn(modeSelector('Name') && 'selected')}>
                <div
                  class={cn('tab-item-content')}
                  {...buttonize(() => setSearchMode('Name'))}
                >
                  By Name
                </div>
              </li>
              <li class={cn(modeSelector('Members Count') && 'selected')}>
                <div
                  class={cn('tab-item-content')}
                  {...buttonize(() => setSearchMode('Members Count'))}
                >
                  By Members Count
                </div>
              </li>
              <li class={cn(modeSelector('Created Time') && 'selected')}>
                <div
                  class={cn('tab-item-content')}
                  {...buttonize(() => setSearchMode('Created Time'))}
                >
                  By Created Time
                </div>
              </li>
            </ul>
          </div>
          <div class={cn('mx-1')}>
            <Switch fallback={<div>Not Found</div>}>
              <Match when={searchMode() === 'Name'}>
                <InputField
                  inputId="search-room-name"
                  labelText="Target Room Name"
                  ofLabel={{
                    class: cn('font-bold'),
                  }}
                  ofInput={{
                    onKeyDown: searchByNameHandler,
                  }}
                  ofWrapper={{
                    class: cn('mt-1'),
                  }}
                  layoutFn={(Label, Input) => (
                    <>
                      <div class={cn('level', 'mb-1')}>
                        <div class={cn('level-item')}>
                          <Label />
                        </div>
                        <div class={cn('level-item')}>
                          <RefreshButton />
                        </div>
                      </div>
                      <Input />
                    </>
                  )}
                />
                <SuspensedSearchResultList resultsKey="byName" />
              </Match>
              <Match when={searchMode() === 'Members Count'}>
                <div class={cn('level', 'mt-1')}>
                  <div class={cn('level-item', 'font-bold')}>
                    Searched By Members Count (Top 1 ~ 10)
                  </div>
                  <div class={cn('level-item')}>
                    <RefreshButton />
                  </div>
                </div>
                <div class={cn('divider', 'my-1')} />
                <SuspensedSearchResultList resultsKey="byMembersCount" />
              </Match>
              <Match when={searchMode() === 'Created Time'}>
                <div class={cn('level', 'mt-1')}>
                  <div class={cn('level-item', 'font-bold')}>
                    Searched By Created Time (Top 1 ~ 10)
                  </div>
                  <div class={cn('level-item')}>
                    <RefreshButton />
                  </div>
                </div>
                <div class={cn('divider', 'my-1')} />
                <SuspensedSearchResultList resultsKey="byCreatedTime" />
              </Match>
            </Switch>
          </div>
          <Suspense fallback="">
            <EnterModal />
          </Suspense>
        </div>
      );
    };
  },
};

export declare module SearchRooms {
  export interface Context {
    auth: FirebaseAuth;
    db: FirebaseDb;
    dbServerValue: FirebaseDbServerValue;
    redirectToChatPage: EnterModalContext['redirectToChatPage'];
  }
  export interface Props {}
}
