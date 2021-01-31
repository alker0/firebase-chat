import clsx, { Clsx } from 'clsx';
import { Cirrus } from '@alker/cirrus-types';
import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import { getRequestingPath } from '@lib/rtdb/utils';
import { NON_EXISTANT_DOM_HREF } from '@lib/constants';
import {
  checkPasswordNecessity,
  createHandlerForEnter,
  CreateHendlerForEnterOption,
  EnterResult,
  modalStateWhenNonTarget,
  createModalStateUpdator,
} from '@lib/enter-room/utils';
import {
  createComputed,
  createResource,
  createSignal,
  JSX,
  batch,
  createState,
  For,
} from 'solid-js';
import { Show } from 'solid-js/web';
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

export function createEnterModalComponent(context: EnterModalContext) {
  const [targetHasPassword, loadPasswordNecessity] = createResource(true);
  const [targetIsOwnRoom, setTargetIsOwnRoom] = createSignal(false);
  const [getInputPassword, setInputPassword] = createSignal<string>('');

  const [enterResult, startEnter] = createResource<EnterResult>();

  const [modalState, setModalState] = createState(modalStateWhenNonTarget);

  const [getCancelEnteringFn, setCancelEnteringFn] = createSignal(() => {});
  const CancelAnchor = createCancelAnchor({
    getCancelEnteringFn,
  });

  const handlerForEnter = createHandlerForEnter({
    targetIsOwnRoom,
    targetHasPassword: () => targetHasPassword() ?? true,
    getInputPassword,
    setInputPassword,
    getSelectingRoomRow: context.getSelectingRoomRow,
    startEntering: startEnter,
    redirectToChatPage: context.redirectToChatPage,
    setCancelEnteringFn,
    executeOption: {
      ...context.executeEnterOption,
      auth: context.auth,
      db: context.db,
    },
  });

  return () => {
    createComputed(() =>
      batch(() => {
        const selectingRoom = context.getSelectingRoomRow();
        if (selectingRoom) {
          const { roomId, ownerId } = selectingRoom;
          if (roomId) {
            if (context.auth.currentUser?.uid === ownerId) {
              setTargetIsOwnRoom(true);
            } else {
              setTargetIsOwnRoom(false);
              loadPasswordNecessity(() =>
                checkPasswordNecessity({
                  db: context.db,
                  requestingPath: getRequestingPath(roomId),
                }),
              );
            }
          }
        } else {
          setTargetIsOwnRoom(false);
          loadPasswordNecessity(() => true);
        }
        startEnter(() => 'NeverStarted');
        setInputPassword('');
      }),
    );

    createModalStateUpdator({
      getSelectingRoomRow: context.getSelectingRoomRow,
      setModalState,
      targetHasPassword,
      enterResult,
      targetIsOwnRoom,
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
                      modalState.enterButtonShoudBeLoading && [
                        'loading',
                        'loading-left',
                      ],
                    )}
                    disabled={modalState.enterButtonShoudBeLoading}
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
    'getSelectingRoomRow' | 'redirectToChatPage'
  > {
  auth: FirebaseAuth;
  db: FirebaseDb;
  executeEnterOption: Omit<
    CreateHendlerForEnterOption['executeOption'],
    'auth' | 'db' | 'startEntering' | 'setCancelEnteringFn'
  >;
  enterModelId: string;
}
