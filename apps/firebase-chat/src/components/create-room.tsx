import { Form } from '@components/common/base/form/form';
import { FormContainer } from '@components/common/base/form/form-container';
import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import {
  memoHandler,
  buttonize,
} from '@components/common/util/component-utils';
import { Cirrus } from '@alker/cirrus-types';
import { EventArg, EventArgOf } from '@components/types/component-utils';
import { CallableSubmit } from '@components/common/util/input-field-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import { roomEntrances } from '@lib/rtdb/variables';
import {
  createRoomIntoDb,
  createRoomWithRetry,
  ownRoomsIsFilled,
} from '@lib/rtdb/create-room';
import clsx, { Clsx } from 'clsx';
import {
  assignProps,
  createMemo,
  createState,
  SetStateFunction,
  State,
  untrack,
  JSX,
  batch,
} from 'solid-js';
import {
  FirebaseAuth,
  FirebaseDb,
  FirebaseDbServerValue,
} from './typings/firebase-sdk';

const cn: Clsx<Cirrus> = clsx;

const roomNameMaxLength = 20;
const passwordMaxLength = 20;

interface ContainerProps {
  onSubmit?: JSX.FormHTMLAttributes<HTMLFormElement>['onSubmit'];
  children?: JSX.HTMLAttributes<HTMLElement>['children'];
}

const defaultContainerProps: Required<ContainerProps> = {
  onSubmit: () => {},
  children: '',
};

const Container = FormContainer.createComponent({
  createContainer: () => (propsArg: ContainerProps = {}) => {
    const props = assignProps({}, defaultContainerProps, propsArg);
    return (
      <form class={cn('content', 'frame')} onSubmit={props.onSubmit}>
        <div class={cn('content')}>
          <div class={cn('frame__header', 'u-text-center')}>
            <h6>Create Your New Chat Room</h6>
          </div>
          <div class={cn('frame__body')} children={props.children} />
        </div>
      </form>
    );
  },
});

interface BottomProps {
  readonly linkButtonHide: boolean;
  linkButtonColorStyle: Cirrus;
  linkButtonText: string;
  linkButtonAction: () => void;
}

const InputField = BasicInputField.createComponent({
  fieldSize: 'small',
});

interface InputProps {
  getInputValue: CreateRoom.InputValueState['getter'];
  setInputValue: CreateRoom.InputValueState['setter'];
}

const maxOwnRoomCount = 3;

export const CreateRoom = {
  createComponent: (context: CreateRoom.Context) => {
    const FormComponent = Form.createComponent({
      container: Container,
      inputFields: (props: InputProps) => (
        <>
          <div class={cn('u-text-center', 'text-info')}>
            {props.getInputValue.infoMessage}
          </div>
          <div class={cn('u-text-center', 'text-danger')}>
            {props.getInputValue.errorMessage}
          </div>
          <InputField
            labelText="Room Name:"
            ofInput={{
              name: 'room-name',
              id: 'input-room-name',
              type: 'text',
              required: true,
              pattern: `^.{1,${roomNameMaxLength - 1}}$`,
              value: props.getInputValue.roomName,
              onChange: (e: EventArg<HTMLInputElement>) =>
                props.setInputValue('roomName', e.target.value),
            }}
          />
          <InputField
            labelText="Room Password:"
            ofInput={{
              name: 'room-password',
              id: 'input-room-password',
              type: 'text',
              required: false,
              pattern: `^.{0,${passwordMaxLength - 1}}$`,
              value: props.getInputValue.password,
              onChange: (e: EventArg<HTMLInputElement>) =>
                props.setInputValue('password', e.target.value),
            }}
          />
        </>
      ),
      bottomContents: (props: BottomProps) => (
        <>
          <input
            type="submit"
            disabled={!sessionState.loginState.isLoggedIn}
            class={cn('animated', 'btn-primary')}
          />
          <button
            class={cn(
              'btn-animated',
              props.linkButtonColorStyle,
              props.linkButtonHide && 'u-none',
            )}
            {...buttonize(props.linkButtonAction)}
          >
            {props.linkButtonText}
          </button>
        </>
      ),
    });

    return () => {
      const [getInputValue, setInputValue] = createState<
        CreateRoom.InputValueState['scheme']
      >({
        roomName: '',
        password: '',
        infoMessage: '',
        errorMessage: '',
      });

      const [getBottomProps, setBottomProps] = createState<BottomProps>({
        linkButtonColorStyle: 'btn-link',
        get linkButtonHide(): boolean {
          // eslint-disable-next-line react/no-this-in-sfc
          return !this.linkButtonText;
        },
        linkButtonText: '',
        linkButtonAction: () => {},
      });

      const onSubmit: () => CallableSubmit = createMemo(() => {
        if (untrack(() => !sessionState.loginState.isLoggedIn)) {
          return (e: EventArgOf<CallableSubmit>) => {
            e.preventDefault();
            console.log('Is Not Logged In');
            context.redirectToFailedUrl();
          };
        }

        return () => {
          const {
            auth: { currentUser },
            db,
            dbServerValues,
          } = context;

          if (currentUser) {
            const { uid } = currentUser;

            const { roomName, password } = untrack(() => ({
              roomName: getInputValue.roomName,
              password: getInputValue.password,
            }));

            const roomId = db.ref(roomEntrances).push().key!;

            batch(() => {
              createRoomWithRetry(async (ownRoomId) => {
                createRoomIntoDb(
                  db,
                  dbServerValues,
                  uid,
                  roomName,
                  password,
                  ownRoomId,
                  roomId,
                );
              }, maxOwnRoomCount)
                .then(({ succeeded, ownRoomId }) => {
                  if (succeeded) {
                    setInputValue({
                      infoMessage: 'Your new chat room is created',
                      errorMessage: '',
                    });

                    const {
                      text: linkButtonText,
                      onClick: linkButtonAction,
                    } = context.linkBurronView.created(ownRoomId);

                    setBottomProps({
                      linkButtonColorStyle: 'btn-info',
                      linkButtonText,
                      linkButtonAction,
                    });
                    console.log(linkButtonText);
                  } else {
                    ownRoomsIsFilled(db, uid, maxOwnRoomCount).then(
                      (isFilled) => {
                        if (isFilled) {
                          setInputValue({
                            infoMessage: '',
                            errorMessage: `You can create only ${maxOwnRoomCount} rooms`,
                          });

                          const {
                            text: linkButtonText,
                            onClick: linkButtonAction,
                          } = context.linkBurronView.alreadyFilled;

                          setBottomProps({
                            linkButtonColorStyle: 'btn-warning',
                            linkButtonText,
                            linkButtonAction,
                          });
                        } else {
                          throw new Error(
                            'Permission denied with the unknown reasons',
                          );
                        }
                      },
                    );
                  }
                })
                .catch((error) => {
                  console.error(error);

                  setInputValue({
                    infoMessage: '',
                    errorMessage: 'Failed to create room',
                  });

                  const {
                    text: linkButtonText,
                    onClick: linkButtonAction,
                  } = context.linkBurronView.failed;

                  setBottomProps({
                    linkButtonColorStyle: 'btn-error',
                    linkButtonText,
                    linkButtonAction,
                  });
                });
            });
          }

          return false;
        };
      });

      return (
        <FormComponent
          ofContainer={{
            containerProps: {
              onSubmit: memoHandler(onSubmit),
            },
          }}
          ofInputFields={{
            getInputValue,
            setInputValue,
          }}
          ofBottomContents={getBottomProps}
        />
      );
    };
  },
};

export declare module CreateRoom {
  export interface Context {
    redirectToFailedUrl: () => void;
    linkBurronView: {
      created: (ownRoomId: string) => LinkButtonView;
      alreadyFilled: LinkButtonView;
      failed: LinkButtonView;
    };
    auth: FirebaseAuth;
    db: FirebaseDb;
    dbServerValues: FirebaseDbServerValue;
  }
  export interface Props {}

  export interface InputValueState {
    scheme: {
      roomName: string;
      password: string;
      infoMessage: string;
      errorMessage: string;
    };
    getter: State<InputValueState>['scheme'];
    setter: SetStateFunction<InputValueState['scheme']>;
  }

  export interface LinkButtonView {
    text: string;
    onClick: () => void;
  }
}
