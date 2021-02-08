import { batch, createComputed, Resource, SetStateFunction } from 'solid-js';
import { getPassword, RequestingBaseOption } from './rtdb';
import { EnterResult, EnterOption, executeEnter } from './enter';
import { RoomRow } from '../search-rooms/search';
import { DO_NOTHING } from '../common-utils';

export type { EnterResult };

export async function checkPasswordNecessity(option: RequestingBaseOption) {
  const necessity = await getPassword(option);
  return !necessity.succeeded;
}

export interface CreateHendlerForEnterOption {
  targetIsOwnRoom: () => boolean;
  targetHasPassword: () => boolean;
  getInputPassword: () => string;
  setInputPassword: (password: string) => void;
  getSelectingRoomRow: () => RoomRow | undefined;
  startEntering: (fn: () => Promise<EnterResult>) => Promise<EnterResult>;
  setCancelEnteringFn: (cancelFn: () => void) => void;
  onSuccess: (targetRoom: Required<RoomRow>) => void;
  executeOption: Omit<
    EnterOption,
    'targetRoomId' | 'inputPassword' | 'handleEntering'
  >;
}

export function createHandlerForEnter(option: CreateHendlerForEnterOption) {
  return function handlerForEnter(event: Event) {
    event.preventDefault();
    const {
      targetIsOwnRoom,
      targetHasPassword,
      getInputPassword,
      getSelectingRoomRow,
      startEntering,
      setCancelEnteringFn,
      onSuccess,
      executeOption,
    } = option;
    const inputPassword = getInputPassword();
    const targetRoom = getSelectingRoomRow();

    if (targetRoom?.roomId) {
      const { roomId } = targetRoom;

      if (targetIsOwnRoom()) {
        onSuccess(targetRoom);
      } else if (!targetHasPassword() || inputPassword.length) {
        startEntering(async () => {
          const enterResult = await executeEnter({
            ...executeOption,
            targetRoomId: roomId,
            inputPassword,
            handleEntering: setCancelEnteringFn,
          });

          batch(() => {
            setCancelEnteringFn(DO_NOTHING);
            if (enterResult === 'Succeeded') {
              onSuccess(targetRoom);
            }
          });

          return enterResult;
        });
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
  enterButtonShoudBeLoading: boolean;
}

export const modalStateWhenNonTarget: ModalState = {
  titleText: 'No room is selected as the entering target',
  onlyTitle: true,
  bodyTexts: [],
  bodyTextStyle: undefined,
  inputShown: false,
  inputDisabled: true,
  enterButtonShoudBeLoading: true,
};

export interface ModalStateUpdateOption {
  getSelectingRoomRow: () => RoomRow | undefined;
  setModalState: SetStateFunction<ModalState>;
  targetHasPassword: Resource<boolean>;
  enterResult: Resource<EnterResult>;
  targetIsOwnRoom: () => boolean;
  successTextStyle: string;
  errorTextStyle: string;
}

export function createModalStateUpdator(option: ModalStateUpdateOption) {
  createComputed(() =>
    batch(() => {
      const {
        getSelectingRoomRow,
        setModalState,
        targetHasPassword,
        enterResult,
        targetIsOwnRoom,
        successTextStyle,
        errorTextStyle,
      } = option;

      const selectingRoomRow = getSelectingRoomRow();

      if (selectingRoomRow) {
        setModalState('onlyTitle', false);
        const { roomName } = selectingRoomRow;
        if (targetHasPassword.loading) {
          setModalState({
            titleText: `Checking that the password of ${roomName} is needed...`,
            bodyTexts: ['Wait a minute...'],
            bodyTextStyle: undefined,
            inputShown: false,
            inputDisabled: true,
            enterButtonShoudBeLoading: true,
          });
        } else if (enterResult.loading) {
          setModalState({
            bodyTexts: ['Entering...'],
            bodyTextStyle: undefined,
            inputDisabled: true,
            enterButtonShoudBeLoading: true,
          });
        } else {
          setModalState('enterButtonShoudBeLoading', false);
          if (targetIsOwnRoom()) {
            setModalState({
              titleText: 'This is your own room',
              bodyTexts: ['Click [Enter] button to enter your room'],
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
                    targetHasPassword()
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
            if (targetHasPassword()) {
              setModalState({
                titleText: `Input password of ${roomName}`,
                inputShown: true,
                inputDisabled: false,
              });
            } else {
              setModalState({
                titleText: `${roomName} does not have a password`,
                bodyTexts: ['Click [Enter] button to enter this room'],
                inputShown: false,
                inputDisabled: true,
              });
            }
          }
        }
      } else {
        setModalState(modalStateWhenNonTarget);
      }
    }),
  );
}
