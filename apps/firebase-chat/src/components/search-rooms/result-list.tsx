import { createDisposableStyle } from '@components/common/util/style-utils';
import { NON_EXISTANT_DOM_ID } from '@lib/constants';
import { logger, shouldLog } from '@lib/logger';
import { RoomRow, SearchResultsKey } from '@lib/search-rooms/search';
import { getOldnessText, ResultsInfoResources } from '@lib/search-rooms/utils';
import { Cirrus } from '@alker/cirrus-types';
import { css } from 'styled-jsx/css';
import clsx, { Clsx } from 'clsx';
import { createEffect } from 'solid-js';
import { For, Switch, Match, Suspense } from 'solid-js/web';

const cn: Clsx<Cirrus> = clsx;

const enterModalAnchorStyle = createDisposableStyle<Cirrus>(
  () => css.resolve`
    a {
      display: block;
    }
  `,
).className;

interface ResultRowProps {
  roomRow: RoomRow;
  enterModalId: string;
  // eslint-disable-next-line react/no-unused-prop-types
  setSelectingRoomRow: (roomRow: RoomRow) => void;
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
      resultsInfoResources,
      enterModalId = NON_EXISTANT_DOM_ID,
      setSelectingRoomRow,
    } = context;

    const [targetResource] = resultsInfoResources[resultsKey];

    if (shouldLog({ prefix: 'Search Result Length' })) {
      interface LogEffectSchema {
        isPresent: boolean;
        list: RoomRow[];
      }

      createEffect<LogEffectSchema>(
        (
          prev = {
            isPresent: false,
            list: [],
          },
        ) => {
          if (targetResource.loading) {
            logger.log(
              { prefix: 'Result List Component', defaultDo: true },
              'Skip for loading',
            );

            return prev;
          }
          const searchResultList = targetResource()!.resultList;

          if (prev.list === searchResultList) {
            logger.log(
              { prefix: 'Result List Component', defaultDo: true },
              'Skip because both lists are same',
            );

            return prev;
          }

          const nextIsPresent = Boolean(searchResultList.length);

          if (!prev?.isPresent && !nextIsPresent) {
            logger.log(
              { prefix: 'Result List Component', defaultDo: true },
              'Skip because both lists are empty',
            );

            return prev;
          } else {
            logger.log(
              { prefix: 'Result List Component' },
              `Result Length (${resultsKey})`,
              searchResultList.length,
            );

            return {
              isPresent: nextIsPresent,
              list: searchResultList ?? [],
            };
          }
        },
      );
    }
    return (
      <Suspense fallback="Failed to Search">
        <Switch fallback="Not Found">
          <Match when={targetResource.loading}>Searching...</Match>
          <Match when={targetResource()!.resultList[0]}>
            {(firstRow) => (
              <>
                <div class={cn('row', 'row--no-wrap')}>
                  <SearchResultRow
                    roomRow={firstRow}
                    enterModalId={enterModalId}
                    setSelectingRoomRow={setSelectingRoomRow}
                  />
                </div>
                <For each={targetResource()!.resultList.slice(1)}>
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
              </>
            )}
          </Match>
        </Switch>
      </Suspense>
    );
  };
}

export interface SearchResultListContext {
  resultsInfoResources: ResultsInfoResources;
  enterModalId?: string;
  setSelectingRoomRow: (roomRow: RoomRow) => void;
}
