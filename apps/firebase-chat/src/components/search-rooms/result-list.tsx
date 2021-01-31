import { Cirrus } from '@alker/cirrus-types';
import { css } from 'styled-jsx/css';
import clsx, { Clsx } from 'clsx';
import { createDisposableStyle } from '@components/common/util/style-utils';
import { NON_EXISTANT_DOM_ID } from '@lib/constants';
import { createMemo, untrack, createRoot, onCleanup } from 'solid-js';
import { For, Switch, Match, Suspense } from 'solid-js/web';
import {
  RoomRow,
  SearchResults,
  SearchResultsKey,
} from '../../lib/search-rooms/search';
import { getOldnessText } from '../../lib/search-rooms/utils';
import { logger } from '../../lib/logger';

const cn: Clsx<Cirrus> = clsx;

const enterModalAnchorStyle = createDisposableStyle<Cirrus>(
  () => css.resolve`
    a {
      display: block;
    }
  `,
).className;

interface AsyncSearchResults extends SearchResults {
  loading: Record<SearchResultsKey, boolean>;
}

interface ResultRowProps {
  roomRow: RoomRow;
  enterModalId: string;
  /* eslint-disable react/no-unused-prop-types */
  setSelectingRoomRow: (roomRow: RoomRow) => void;
  /* eslint-enable react/no-unused-prop-types */
}

function createRoomRowClickHandler(props: ResultRowProps) {
  return function roomRowClickHandler() {
    props.setSelectingRoomRow(props.roomRow);
  };
}

function SearchResultRow(props: ResultRowProps) {
  const roomRowClickHandler = createRoomRowClickHandler(props);
  return (
    <>
      <div class={cn('col')}>
        <a
          href={`#${props.enterModalId}`}
          class={cn(enterModalAnchorStyle)}
          onClick={roomRowClickHandler}
        >
          <strong>{props.roomRow.roomName}</strong>
        </a>
      </div>
      <div class={cn('col-2', 'offset-left')}>
        <span class={cn('mx-1')} role="img" aria-label="members-count">
          👪
        </span>
        {props.roomRow.membersCount}
      </div>
      <div class={cn('col-4')}>
        <span class={cn('mx-1')} role="img" aria-label="members-count">
          ⏲
        </span>
        <small>
          Created at {getOldnessText(props.roomRow.createdTime)} ago
        </small>
      </div>
    </>
  );
}

export function createSearchResultListComponent(
  context: SearchResultListContext,
) {
  return function SearchResultList({
    resultsKey,
  }: {
    resultsKey: SearchResultsKey;
  }) {
    const {
      searchResultsState,
      enterModalId = NON_EXISTANT_DOM_ID,
      setSelectingRoomRow,
    } = context;

    const [disposeMemo, resultsMemo] = createRoot((...dispose) => {
      const presentMemo = createMemo(
        () => {
          return Boolean(searchResultsState[resultsKey].resultList.length);
        },
        false,
        (prev, next) => !prev && !next,
      );
      return [
        dispose[0],
        createMemo(() => {
          const searchResultList = untrack(
            () => searchResultsState[resultsKey].resultList,
          );

          if (
            !import.meta.env
              .SNOWPACK_PUBLIC_LOG_DISABLE_SEARCH_RESULT_LIST_LENGTH
          ) {
            logger.log(
              'Result List Component',
              'Result Length',
              SearchResultList.length,
            );
          }

          const [firstResult, ...restResults] = searchResultList;

          return {
            isPresent: presentMemo(),
            firstResult,
            restResults,
          };
        }),
      ];
    });

    onCleanup(disposeMemo);

    return (
      <Suspense fallback="Failed to Search">
        <Switch fallback="Not Found">
          <Match when={searchResultsState.loading[resultsKey]}>
            Searching...
          </Match>
          <Match when={resultsMemo().isPresent}>
            <div class={cn('row', 'row--no-wrap')}>
              <SearchResultRow
                roomRow={resultsMemo().firstResult}
                enterModalId={enterModalId}
                setSelectingRoomRow={setSelectingRoomRow}
              />
            </div>
            <For each={resultsMemo().restResults}>
              {(roomRow) => (
                <>
                  <div class={cn('divider', 'mx-1', 'my-0')} />
                  <div class={cn('row', 'row--no-wrap')}>
                    <SearchResultRow
                      roomRow={roomRow}
                      enterModalId={enterModalId}
                      setSelectingRoomRow={setSelectingRoomRow}
                    />
                  </div>
                </>
              )}
            </For>
          </Match>
        </Switch>
      </Suspense>
    );
  };
}

export interface SearchResultListContext {
  searchResultsState: AsyncSearchResults;
  enterModalId?: string;
  setSelectingRoomRow: (roomRow: RoomRow) => void;
}
