import { Form } from '@components/common/base/form/form';
import { FormContainer } from '@components/common/base/form/form-container';
import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import { FormBasicBottom } from '@components/common/cirrus/domain/form-basic-bottom';
import { memoHandler } from '@components/common/util/component-utils';
import { Cirrus } from '@alker/cirrus-types';
import { EventArg, EventArgOf } from '@components/types/component-utils';
import { CallableSubmit } from '@components/common/util/input-field-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import { isPermissionDeniedError } from '@lib/rtdb-utils';
import clsx, { Clsx } from 'clsx';
import {
  assignProps,
  createMemo,
  createState,
  SetStateFunction,
  State,
  untrack,
  JSX,
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

const InputField = BasicInputField.createComponent({
  fieldSize: 'small',
});

// button.animated.btn-info.outline
const Bottom = FormBasicBottom.createComponent();

interface InputProps {
  getInputValue: CreateRoom.InputValueState['getter'];
  setInputValue: CreateRoom.InputValueState['setter'];
}

const roomEntrances = 'room_entrances';
const maxOwnRoomId = 3;

async function createRoomIntoDb(
  db: FirebaseDb,
  dbServerValues: FirebaseDbServerValue,
  uid: string,
  getInputValue: CreateRoom.InputValueState['getter'],
) {
  const roomId = db.ref(roomEntrances).push().key;
  const { roomName, password } = untrack(() => ({
    roomName: getInputValue.roomName,
    password: getInputValue.password,
  }));

  let succeeded = false;
  let ownRoomId = 1;
  for (; ownRoomId <= maxOwnRoomId; ownRoomId += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await db.ref().update({
        [`rooms/${uid}/${ownRoomId}/public_info`]: {
          room_id: roomId,
        },
        [`${roomEntrances}/${roomId}`]: {
          owner_id: uid,
          own_room_id: String(ownRoomId),
          room_name: roomName,
          members_count: 1,
          created_at: dbServerValues.TIMESTAMP,
        },
        [`room_members_info/${roomId}/requesting/password`]: password,
      });

      succeeded = true;

      break;
    } catch (error) {
      if (!isPermissionDeniedError(error)) throw error;
    }
  }
  if (succeeded) {
    return ownRoomId;
  } else {
    throw new Error('Failed to create room because permission denied');
  }
}

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
      bottomContents: () => (
        <Bottom
          ofSubmit={{
            disabled: !sessionState.loginState.isLoggedIn,
            class: cn('animated', 'btn-primary'),
          }}
        />
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
            createRoomIntoDb(db, dbServerValues, uid, getInputValue)
              .then(() => {
                console.log('Success to create room');

                setTimeout(context.redirectToSuccessUrl, 5000);
              })
              .catch((error) => {
                console.error(error);

                setInputValue('errorMessage', 'Failed to create room');
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
        />
      );
    };
  },
};

export declare module CreateRoom {
  export interface Context {
    redirectToSuccessUrl: () => void;
    redirectToFailedUrl: () => void;
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

  export type InputValueScheme = InputValueState['scheme'];

  export type InputValueAccessor = [
    InputValueState['getter'],
    InputValueState['setter'],
  ];
}
