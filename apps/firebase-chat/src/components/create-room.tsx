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
  CreateRoomRunnerArgs,
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
  linkButtonView: CreateRoom.LinkButtonView;
  readonly linkButtonText: string;
  readonly linkButtonAction: () => void;
}

const InputField = BasicInputField.createComponent({
  fieldSize: 'small',
});

interface FormState {
  scheme: {
    roomName: string;
    password: string;
    infoMessage: string;
    errorMessage: string;
  };
  getter: State<FormState>['scheme'];
  setter: SetStateFunction<FormState['scheme']>;
}

interface FormStateAccessors {
  formState: FormState['getter'];
  setFormState: FormState['setter'];
}

interface InputProps extends FormStateAccessors {}

interface MessageState
  extends Pick<FormState['scheme'], 'infoMessage' | 'errorMessage'> {}

const maxOwnRoomCount = 3;

async function createRoomAndUpdateLinkButton(
  {
    db,
    dbServerValues,
    uid,
    formState,
    setFormState,
  }: Pick<CreateRoomRunnerArgs, 'db' | 'dbServerValues' | 'uid'> &
    FormStateAccessors,
  setBottomProps: SetStateFunction<BottomProps>,
  linkButtonViewContext: CreateRoom.LinkButtonViewContext,
) {
  const { roomName, password } = untrack(() => ({
    roomName: formState.roomName,
    password: formState.password,
  }));

  const roomId = db.ref(roomEntrances).push().key!;

  function updateView({
    infoMessage,
    errorMessage,
    linkButtonView,
    linkButtonColorStyle,
  }: MessageState &
    Pick<BottomProps, 'linkButtonView' | 'linkButtonColorStyle'>) {
    batch(() => {
      setFormState({
        infoMessage,
        errorMessage,
      });

      setBottomProps({
        linkButtonColorStyle,
        linkButtonView,
      });
    });
  }

  try {
    const { succeeded, ownRoomId } = await createRoomWithRetry(
      (ownRoomIdArg) =>
        createRoomIntoDb({
          db,
          dbServerValues,
          uid,
          roomName,
          password,
          ownRoomId: ownRoomIdArg,
          roomId,
        }),
      maxOwnRoomCount,
    );

    if (succeeded) {
      updateView({
        infoMessage: 'Your new chat room is created',
        errorMessage: '',
        linkButtonView: linkButtonViewContext.created(ownRoomId),
        linkButtonColorStyle: 'btn-info',
      });
    } else {
      const isFilled = await ownRoomsIsFilled(db, uid, maxOwnRoomCount);
      if (isFilled) {
        updateView({
          infoMessage: '',
          errorMessage: `You can create only ${maxOwnRoomCount} rooms`,
          linkButtonView: linkButtonViewContext.alreadyFilled,
          linkButtonColorStyle: 'btn-warning',
        });
      } else {
        throw new Error('Permission denied with the unknown reasons');
      }
    }
  } catch (error) {
    console.error(error);

    updateView({
      infoMessage: '',
      errorMessage: 'Failed to create room',
      linkButtonView: linkButtonViewContext.failed,
      linkButtonColorStyle: 'btn-error',
    });
  }
}

export const CreateRoom = {
  createComponent: (context: CreateRoom.Context) => {
    const FormComponent = Form.createComponent({
      container: Container,
      inputFields: (props: InputProps) => (
        <>
          <div class={cn('u-text-center', 'text-info')}>
            {props.formState.infoMessage}
          </div>
          <div class={cn('u-text-center', 'text-danger')}>
            {props.formState.errorMessage}
          </div>
          <InputField
            labelText="Room Name:"
            ofInput={{
              name: 'room-name',
              id: 'input-room-name',
              type: 'text',
              required: true,
              pattern: `^.{1,${roomNameMaxLength - 1}}$`,
              value: props.formState.roomName,
              onChange: (e: EventArg<HTMLInputElement>) =>
                props.setFormState('roomName', e.target.value),
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
              value: props.formState.password,
              onChange: (e: EventArg<HTMLInputElement>) =>
                props.setFormState('password', e.target.value),
            }}
          />
        </>
      ),
      bottomContents: (props: BottomProps) => (
        <>
          <input
            type="submit"
            disabled={!sessionState.isLoggedIn}
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
      const [formState, setFormState] = createState<FormState['scheme']>({
        roomName: '',
        password: '',
        infoMessage: '',
        errorMessage: '',
      });

      const [getBottomProps, setBottomProps] = createState<BottomProps>({
        linkButtonColorStyle: 'btn-link',
        get linkButtonHide(): boolean {
          // eslint-disable-next-line react/no-this-in-sfc
          return !(this as BottomProps).linkButtonText;
        },
        linkButtonView: {
          text: '',
          onClick: () => {},
        },
        get linkButtonText() {
          return (this as BottomProps).linkButtonView.text;
        },
        get linkButtonAction() {
          return (this as BottomProps).linkButtonView.onClick;
        },
      });

      const onSubmit: () => CallableSubmit = createMemo(() => {
        if (untrack(() => !sessionState.isLoggedIn)) {
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
            createRoomAndUpdateLinkButton(
              {
                db,
                dbServerValues,
                uid: currentUser.uid,
                formState,
                setFormState,
              },
              setBottomProps,
              context.linkButtonView,
            );
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
            formState,
            setFormState,
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
    linkButtonView: LinkButtonViewContext;
    auth: FirebaseAuth;
    db: FirebaseDb;
    dbServerValues: FirebaseDbServerValue;
  }
  export interface Props {}

  export interface LinkButtonView {
    text: string;
    onClick: () => void;
  }

  export interface LinkButtonViewContext {
    created: (ownRoomId: string) => LinkButtonView;
    alreadyFilled: LinkButtonView;
    failed: LinkButtonView;
  }
}
