import { batch, createComputed, Resource, SetStateFunction } from 'solid-js';
import { getPassword, RequestingBaseOption } from './rtdb';
import {
  EnterCondition,
  EnterResult,
  EnterOption,
  executeEnter,
} from './enter';
import { RoomEntranceInfo } from '../rtdb/utils';
import { CONSIDER, DO_NOTHING } from '../common-utils';
import { RoomRow } from '../search-rooms/search';

export type { EnterResult };

export async function checkPasswordNecessity(option: RequestingBaseOption) {
  const necessity = await getPassword(option);
  return necessity == null;
}

export interface CreateHendlerForEnterOption {
  targetIsOwnRoom: () => boolean;
  getEnterCondition: () => EnterCondition | undefined;
  getInputPassword: () => string;
  setInputPassword: (password: string) => void;
  getSelectingRoomRow: () => RoomRow | undefined;
  startEnter: (enterResultPromise: Promise<EnterResult>) => unknown;
  setCancelEnteringFn: (cancelFn: () => void) => void;
  onSuccess: (targetRoom: RoomEntranceInfo) => void;
  executeOption: Omit<
    EnterOption,
    'targetRoomId' | 'enterCondition' | 'inputPassword' | 'waitFn'
  >;
}

export function createHandlerForEnter(option: CreateHendlerForEnterOption) {
  return function handlerForEnter(event: Event) {
    event.preventDefault();
    const {
      targetIsOwnRoom,
      getEnterCondition,
      getInputPassword,
      getSelectingRoomRow,
      startEnter,
      setCancelEnteringFn,
      onSuccess,
      executeOption,
    } = option;
    const inputPassword = getInputPassword();
    const targetRoom = getSelectingRoomRow();

    if (targetRoom?.roomId) {
      CONSIDER<RoomEntranceInfo>(targetRoom);

      const enterCondition = getEnterCondition() ?? 'NeedsPassword';

      if (targetIsOwnRoom() || enterCondition === 'IsAlreadyMember') {
        onSuccess(targetRoom);
        startEnter(Promise.resolve('Succeeded'));
      } else if (enterCondition !== 'NeedsPassword' || inputPassword.length) {
        const { roomId } = targetRoom;
        startEnter(
          executeEnter({
            ...executeOption,
            targetRoomId: roomId,
            enterCondition,
            inputPassword,
            waitFn: setCancelEnteringFn,
          }).then((enterResult) => {
            return batch(() => {
              setCancelEnteringFn(DO_NOTHING);
              if (enterResult === 'Succeeded') {
                onSuccess(targetRoom);
              }
              return enterResult;
            });
          }),
        );
      }
    }
  };
}

export interface ModalState {
  titleText: string;
  onlyTitle: boolean;
  bodyTexts: string[];
  bodyTextStyle: string | undefined;
  inputShown: boolean;
  inputDisabled: boolean;
  enterButtonShouldBeLoading: boolean;
}

export const modalStateWhenNonTarget: ModalState = {
  titleText: 'No room is selected as the entering target',
  onlyTitle: true,
  bodyTexts: [],
  bodyTextStyle: undefined,
  inputShown: false,
  inputDisabled: true,
  enterButtonShouldBeLoading: true,
};

const loadingModalStateObject: Pick<
  ModalState,
  'bodyTextStyle' | 'inputDisabled' | 'enterButtonShouldBeLoading'
> = {
  bodyTextStyle: undefined,
  inputDisabled: true,
  enterButtonShouldBeLoading: true,
};

export interface ModalStateUpdateOption {
  getSelectingRoomRow: () => RoomRow | undefined;
  setModalState: SetStateFunction<ModalState>;
  targetIsOwnRoom: () => boolean;
  getEnterCondition: Resource<EnterCondition>;
  enterResult: Resource<EnterResult>;
  successTextStyle: string;
  errorTextStyle: string;
}

export function createModalStateUpdator(option: ModalStateUpdateOption) {
  createComputed(() =>
    batch(() => {
      const {
        getSelectingRoomRow,
        setModalState,
        targetIsOwnRoom,
        getEnterCondition,
        enterResult,
        successTextStyle,
        errorTextStyle,
      } = option;

      const selectingRoomRow = getSelectingRoomRow();

      if (selectingRoomRow) {
        setModalState('onlyTitle', false);
        const { roomName } = selectingRoomRow;
        if (getEnterCondition.loading) {
          setModalState({
            ...loadingModalStateObject,
            titleText: `Checking enter condition of ${roomName}...`,
            bodyTexts: ['Wait a minute...'],
            inputShown: false,
          });
        } else if (enterResult.loading) {
          setModalState({
            ...loadingModalStateObject,
            bodyTexts: ['Entering...'],
          });
        } else {
          setModalState('enterButtonShouldBeLoading', false);
          if (targetIsOwnRoom()) {
            setModalState({
              titleText: 'This is your own room',
              bodyTexts: ['Click [ Enter ] button to enter your room'],
              inputShown: false,
              inputDisabled: true,
            });
          } else if (enterResult() === 'Succeeded') {
            setModalState({
              bodyTexts: ['Success!'],
              bodyTextStyle: successTextStyle,
              inputShown: false,
              inputDisabled: true,
            });
          } else {
            switch (enterResult()) {
              case 'FailedOnRequest':
                setModalState({
                  bodyTexts: ['Failed to enter on requesting.'].concat(
                    getEnterCondition() === 'NeedsPassword'
                      ? 'Maybe the input password is invalid.'
                      : [],
                  ),
                  bodyTextStyle: errorTextStyle,
                });
                break;
              case 'FailedOnAutoStart':
                setModalState({
                  bodyTexts: ['Failed to enter by an unknown error.'],
                  bodyTextStyle: errorTextStyle,
                });
                break;
              case 'FailedOnEnter':
                setModalState({
                  bodyTexts: [
                    'Failed to enter on entering.',
                    'Maybe the room owner does not allow you to enter.',
                  ],
                  bodyTextStyle: errorTextStyle,
                });
                break;
              default:
                setModalState({
                  bodyTexts: [],
                  bodyTextStyle: undefined,
                });
                break;
            }
            switch (getEnterCondition()) {
              case 'NeedsPassword':
                setModalState({
                  titleText: `Input password of ${roomName}`,
                  inputShown: true,
                  inputDisabled: false,
                });
                break;
              case 'NeedsRequest':
                setModalState({
                  titleText: `${roomName} does not have a password`,
                  bodyTexts: ['Click [Enter] button to enter this room'],
                  inputShown: false,
                  inputDisabled: true,
                });
                break;
              default:
                setModalState({
                  titleText: 'You can enter this room',
                  bodyTexts: ['Click [ Enter ] button to enter this room'],
                  inputShown: false,
                  inputDisabled: true,
                });
                break;
            }
          }
        }
      } else {
        setModalState(modalStateWhenNonTarget);
      }
    }),
  );
}
