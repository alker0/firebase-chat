import { pathWithoutHash } from '@lib/browser-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import {
  RoomInternalDataSchema,
  RTDB_KEY_PUBLIC_INFO,
  RTDB_KEY_ROOM_ID,
} from '@lib/rtdb/constants';
import {
  checkPropertyTypes,
  DO_NOTHING,
  DO_NOTHING_PROMISE,
} from '@lib/common-utils';
import {
  getAcceptedPath,
  getRequestingPath,
  RoomEntranceInfo,
} from '@lib/rtdb/utils';
import { AcceptingBaseOption, acceptUsersAuto } from '@lib/chat-room/rtdb';
import {
  getAndWatchRoomEntrance,
  getRoomInternalGetAndWatchFn,
} from '@lib/chat-room/utils';
import { logger } from '@lib/logger';
import { createDebugButton } from '@lib/debug-utils';
import { createComputed, createResource } from 'solid-js';
import { NullablePromise } from '../typings/common-utils';
import { FirebaseAuth, FirebaseDb } from '../typings/firebase-sdk';

interface RoomEntranceFromHistoryState
  extends Omit<RoomEntranceInfo, 'ownerId' | 'ownRoomId'> {}

function getRoomEntranceFromHistoryState(): RoomEntranceFromHistoryState | null {
  const historyState = window.history.state as
    | undefined
    | null
    | Partial<RoomEntranceInfo>;
  if (
    historyState &&
    typeof historyState === 'object' &&
    checkPropertyTypes(historyState, {
      roomId: 'string',
      roomName: 'string',
      membersCount: 'number',
      createdTime: 'number',
    })
  ) {
    return historyState;
  }
  return null;
}

type RoomEntrancePromise = NullablePromise<RoomEntranceInfo>;

type RoomEntranceLoadingPromise = NullablePromise<
  [RoomEntrancePromise, () => void]
>;

interface GetRoomEntranceInfoFromDbOption {
  internalInfoPromise:
    | RoomInternalDataSchema
    | NullablePromise<RoomInternalDataSchema>
    | null;
  db: FirebaseDb;
}

async function getRoomEntranceFromDb({
  internalInfoPromise,
  db,
}: GetRoomEntranceInfoFromDbOption): RoomEntranceLoadingPromise {
  const internalInfoResult = await internalInfoPromise;
  if (internalInfoResult) {
    const {
      [RTDB_KEY_PUBLIC_INFO]: { [RTDB_KEY_ROOM_ID]: roomId },
    } = internalInfoResult;

    const [resultPromise, cancelFn] = getAndWatchRoomEntrance(db, roomId);

    return [resultPromise, cancelFn];
  } else {
    return null;
  }
}

async function pickRoomEntranceInfoPromise(
  loadingPromise: RoomEntranceLoadingPromise,
) {
  const entranceLoadResult = await loadingPromise;
  return entranceLoadResult?.[0] ?? null;
}

async function pickRoomEntranceInfoLoadCancelFn(
  loadingPromise: RoomEntranceLoadingPromise,
) {
  const entranceLoadResult = await loadingPromise;
  return entranceLoadResult?.[1] ?? DO_NOTHING;
}

async function setRoomEntranceInfoInfoHistoryState(
  entrancePromise: RoomEntrancePromise,
) {
  const entrance = await entrancePromise;
  window.history.replaceState(entrance, document.title, window.location.href);
}

function getRoomEntrance(
  ownerId: string,
  ownRoomId: string,
  getFromDbOption: GetRoomEntranceInfoFromDbOption,
): [NullablePromise<RoomEntranceInfo>, Promise<() => void>] {
  const entranceFromHistory = getRoomEntranceFromHistoryState();

  if (entranceFromHistory) {
    return [
      Promise.resolve({
        ...entranceFromHistory,
        ownerId,
        ownRoomId,
      }),
      DO_NOTHING_PROMISE,
    ];
  } else {
    const entranceLoadingPromise: RoomEntranceLoadingPromise = getRoomEntranceFromDb(
      getFromDbOption,
    );
    const entrancePromise = pickRoomEntranceInfoPromise(entranceLoadingPromise);

    setRoomEntranceInfoInfoHistoryState(entrancePromise);

    return [
      entrancePromise,
      pickRoomEntranceInfoLoadCancelFn(entranceLoadingPromise),
    ];
  }
}

interface RoomInfoObject {
  internal: RoomInternalDataSchema;
  entrance: RoomEntranceInfo;
}

async function createRoomInfoObject(
  internalPromise: NullablePromise<RoomInternalDataSchema>,
  entrancePromise: RoomEntrancePromise,
  onFailed?: () => void,
): NullablePromise<RoomInfoObject> {
  try {
    const [internal, entrance] = await Promise.all([
      internalPromise,
      entrancePromise,
    ] as const);
    if (internal && entrance) {
      logger.logMultiLines({ prefix: 'Room Info Object' }, [
        ['Internal', internal],
        ['Entrance', entrance],
      ]);

      return {
        internal,
        entrance,
      };
    }
  } catch (error) {
    console.error(error);
  }
  onFailed?.();
  return null;
}

async function startAutoAccepting(
  db: FirebaseDb,
  roomInfoObjectPromise: NullablePromise<RoomInfoObject>,
) {
  const roomInfoObject = await roomInfoObjectPromise;
  if (roomInfoObject) {
    const {
      entrance: { roomId },
    } = roomInfoObject;

    const acceptingOption: AcceptingBaseOption = {
      db,
      requestingPath: getRequestingPath(roomId),
      acceptedPath: getAcceptedPath(roomId),
    };

    // const acceptedUsers = await acceptAllUsers(acceptingOption);
    // if (acceptedUsers) {
    //   logger.log({ prefix: 'Accept All' }, 'Users', acceptedUsers);
    // }

    const cancelFn = acceptUsersAuto(acceptingOption);
    if (cancelFn) {
      createDebugButton({
        innerContents: 'Cancel Auto Accepting',
        onClick: (_e, remove) => {
          cancelFn();
          remove();
        },
      });
    }
  }
}

export const ChatRoom = {
  createComponent: (context: ChatRoom.Context) => {
    return () => {
      const { auth, db, redirectToFailedUrl } = context;

      const [, ownerId, ownRoomId] = pathWithoutHash().slice(1).split('/');

      if (!(ownerId && ownRoomId)) {
        redirectToFailedUrl();
        return undefined;
      }

      const [roomInfo, loadRoomInfo] = createResource<RoomInfoObject | null>(
        null,
      );

      createComputed(
        (
          prev?: {
            uid: string;
            entranceInfoPromise: NullablePromise<RoomEntranceInfo>;
          } | null,
        ) => {
          const { currentUser } = sessionState;
          if (!currentUser) {
            const timeout = setTimeout(redirectToFailedUrl, 3000);
            auth.signInAnonymously().then(() => clearTimeout(timeout));
            return null;
          }

          const currentUserId = currentUser.uid;

          if (currentUserId === prev?.uid) return prev;

          const isOwner = currentUserId === ownerId;

          const [
            internalInfoPromise,
            cancelForInternal,
          ] = getRoomInternalGetAndWatchFn(isOwner)({
            db,
            ownerId,
            ownRoomId,
          });

          const [entranceInfoPromise, cancelForEntrance] = prev
            ? [prev.entranceInfoPromise, DO_NOTHING_PROMISE]
            : getRoomEntrance(ownerId, ownRoomId, {
                db,
                internalInfoPromise,
              });

          const roomInfoObjectPromise = createRoomInfoObject(
            internalInfoPromise,
            entranceInfoPromise,
            redirectToFailedUrl,
          );

          loadRoomInfo(() => roomInfoObjectPromise);

          if (isOwner) {
            startAutoAccepting(db, roomInfoObjectPromise);
          }

          return {
            uid: currentUser.uid,
            entranceInfoPromise,
          };
        },
      );

      return 'Chat Page';
    };
  },
};

export declare module ChatRoom {
  export interface Context {
    redirectToFailedUrl: () => void;
    auth: FirebaseAuth;
    db: FirebaseDb;
  }
  export interface Props {}
}
