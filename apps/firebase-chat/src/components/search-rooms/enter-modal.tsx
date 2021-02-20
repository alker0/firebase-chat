import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import { getRequestingPath, getAcceptedPath } from '@lib/rtdb/utils';
import { NON_EXISTANT_DOM_HREF } from '@lib/constants';
import { DO_NOTHING } from '@lib/common-utils';
import { checkEnterCondition } from '@lib/enter-room/enter';
import {
  createHandlerForEnter,
  CreateHendlerForEnterOption,
  EnterResult,
  modalStateWhenNonTarget,
  createModalStateUpdator,
} from '@lib/enter-room/utils';
import { Cirrus } from '@alker/cirrus-types';
import clsx, { Clsx } from 'clsx';
import {
  createComputed,
  createResource,
  createSignal,
  JSX,
  batch,
  createState,
} from 'solid-js';
import { Show, For } from 'solid-js/web';
import { FirebaseAuth, FirebaseDb } from '../typings/firebase-sdk';

const cn: Clsx<Cirrus> = clsx;

const InputField = BasicInputField.createComponent({
  fieldSize: 'small',
});

function createCancelAnchor(context: {
  getCancelEnteringFn: () => () => void;
}) {
  return (props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={NON_EXISTANT_DOM_HREF}
      aria-label="Close"
      onClick={context.getCancelEnteringFn()}
      {...props}
    />
  );
}

const neverStarted: EnterResult = 'NeverStarted';

export function createEnterModalComponent(context: EnterModalContext) {
  const [targetIsOwnRoom, setTargetIsOwnRoom] = createSignal(false);
  const [targetRoomId, setTargetRoomId] = createSignal(
    '',
    (_prev, next) => !next,
  );
  const [getUid, setUid] = createSignal<string>();
  const [getEnterCondition, { mutate: setEnterCondition }] = createResource(
    () => ({ roomId: targetRoomId(), uid: getUid() }),
    async ({ roomId, uid }) => {
      if (uid) {
        return checkEnterCondition({
          db: context.db,
          requestingPath: getRequestingPath(roomId),
          acceptedPath: getAcceptedPath(roomId),
          uid,
        });
      } else {
        return 'NeedsPassword';
      }
    },
  );
  const [getInputPassword, setInputPassword] = createSignal<string>('');

  const [enterPromise, startEnter] = createSignal<Promise<EnterResult>>(
    Promise.resolve<EnterResult>(neverStarted),
  );
  const [enterResult, { mutate: setEnterResult }] = createResource(
    enterPromise,
    (key) => key,
    neverStarted,
  );

  const [modalState, setModalState] = createState(modalStateWhenNonTarget);

  const [getCancelEnteringFn, setCancelEnteringFn] = createSignal(DO_NOTHING);
  const CancelAnchor = createCancelAnchor({
    getCancelEnteringFn,
  });

  const {
    auth,
    db,
    getSelectingRoomRow,
    executeEnterOption,
    onSuccess,
  } = context;

  const handlerForEnter = createHandlerForEnter({
    targetIsOwnRoom,
    getEnterCondition,
    getInputPassword,
    setInputPassword,
    getSelectingRoomRow,
    startEnter,
    onSuccess,
    setCancelEnteringFn,
    executeOption: {
      ...executeEnterOption,
      auth,
      db,
    },
  });

  return () => {
    createComputed(() =>
      batch(() => {
        const selectingRoom = getSelectingRoomRow();
        if (selectingRoom) {
          const { roomId, ownerId } = selectingRoom;
          if (roomId) {
            const uid = auth.currentUser?.uid;
            if (uid === ownerId) {
              setTargetIsOwnRoom(true);
            } else {
              setTargetIsOwnRoom(false);
              setTargetRoomId(roomId);
              setUid(uid);
            }
          }
        } else {
          setTargetIsOwnRoom(false);
          setEnterCondition('NeedsPassword');
        }
        setEnterResult(neverStarted);
        setInputPassword('');
      }),
    );

    createModalStateUpdator({
      getSelectingRoomRow,
      setModalState,
      targetIsOwnRoom,
      getEnterCondition,
      enterResult,
      successTextStyle: cn('text-success'),
      errorTextStyle: cn('text-danger'),
    });

    return (
      <div
        class={cn('modal', 'modal-animated--zoom-in')}
        id={context.enterModelId}
      >
        <CancelAnchor class={cn('modal-overlay', 'btn-close')} />
        <div class={cn('modal-content')} role="document">
          <div class={cn('modal-header')}>
            <CancelAnchor class={cn('u-pull-right')} />
            <div class={cn('modal-title')}>{modalState.titleText}</div>
          </div>
          <Show when={!modalState.onlyTitle}>
            <form onSubmit={handlerForEnter}>
              <div class={cn('modal-body')}>
                <Show when={modalState.bodyTexts.length}>
                  <div class={modalState.bodyTextStyle ?? ''}>
                    {modalState.bodyTexts[0]}
                    <For each={modalState.bodyTexts.slice(1)}>
                      {(bodyText) => (
                        <>
                          <br />
                          {bodyText}
                        </>
                      )}
                    </For>
                  </div>
                </Show>
                <Show when={modalState.inputShown}>
                  <InputField
                    inputId="enter-room-password"
                    labelText="Password"
                    ofInput={{
                      required: !modalState.inputDisabled,
                      disabled: modalState.inputDisabled,
                      value: getInputPassword(),
                      onChange: (event) => {
                        setInputPassword(event.target.value);
                      },
                    }}
                  />
                </Show>
              </div>
              <div class={cn('modal-footer')}>
                <section class={cn('u-text-right')}>
                  <CancelAnchor>
                    <button
                      type="button"
                      class={cn('btn', 'btn-small', 'u-inline-block')}
                    >
                      Cancel
                    </button>
                  </CancelAnchor>
                  <button
                    type="submit"
                    class={cn(
                      'btn-info',
                      'btn-small',
                      'u-inline-block',
                      'animated',
                      modalState.enterButtonShouldBeLoading && [
                        'loading',
                        'loading-left',
                      ],
                    )}
                    disabled={modalState.enterButtonShouldBeLoading}
                  >
                    Enter
                  </button>
                </section>
              </div>
            </form>
          </Show>
        </div>
      </div>
    );
  };
}

export interface EnterModalContext
  extends Pick<
    CreateHendlerForEnterOption,
    'getSelectingRoomRow' | 'onSuccess'
  > {
  auth: FirebaseAuth;
  db: FirebaseDb;
  executeEnterOption: Omit<
    CreateHendlerForEnterOption['executeOption'],
    'auth' | 'db' | 'startEnter' | 'setCancelEnteringFn'
  >;
  enterModelId: string;
}
