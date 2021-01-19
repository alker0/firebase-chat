import { Cirrus } from '@alker/cirrus-types';
import clsx, { Clsx } from 'clsx';
import { createMemo, untrack, createRoot, onCleanup } from 'solid-js';
import { For, Switch, Match, Suspense } from 'solid-js/web';
import {
  RoomRow,
  SearchResults,
  SearchResultsKey,
} from '../../lib/search-rooms/search';
import { getOldnessText } from '../../lib/search-rooms/utils';

const cn: Clsx<Cirrus> = clsx;

interface AsyncSearchResults extends SearchResults {
  loading: Record<SearchResultsKey, boolean>;
}

function SearchResultRow(props: { roomRow: RoomRow }) {
  return (
    <>
      <div class={cn('col')}>
        <strong>{props.roomRow.roomName}</strong>
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
  searchResultsState: AsyncSearchResults,
) {
  return function SearchResultList(props: { resultsKey: SearchResultsKey }) {
    const { resultsKey } = props;

    const [disposeMemo, resultsMemo] = createRoot((...dispose) => {
      const presentMemo = createMemo(
        () => {
          return Boolean(searchResultsState[resultsKey].resultsList.length);
        },
        false,
        (prev, next) => !prev && !next,
      );
      return [
        dispose[0],
        createMemo(() => {
          const searchResultList = untrack(
            () => searchResultsState[resultsKey].resultsList,
          );

          console.log(
            '[Result List Component]Result Length:',
            searchResultList.length,
          );

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
              <SearchResultRow roomRow={resultsMemo().firstResult} />
            </div>
            <For each={resultsMemo().restResults}>
              {(roomRow) => (
                <>
                  <div class={cn('divider', 'mx-1', 'my-0')} />
                  <div class={cn('row', 'row--no-wrap')}>
                    <SearchResultRow roomRow={roomRow} />
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
