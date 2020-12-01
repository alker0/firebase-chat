import { Form } from '@components/common/base/form/form';
import { FormContainer } from '@components/common/base/form/form-container';
import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import { LoginBasicBottom } from '@components/common/cirrus/domain/login-basic-bottom';
import { memoHandler } from '@components/common/util/component-utils';
import { Cirrus } from '@alker/cirrus-types';
import {
  EventArg,
  EventArgOf,
  OnlyOptional,
} from '@components/types/component-utils';
import { CallableSubmit } from '@components/common/util/input-field-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import clsx, { Clsx } from 'clsx';
import {
  assignProps,
  createComputed,
  createMemo,
  createState,
  SetStateFunction,
  State,
  untrack,
} from 'solid-js';

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
          <div class={cn('frame__header')} />
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
const Bottom = LoginBasicBottom.createComponent();

interface InputProps {
  getInputValue: CreateRoom.InputValueState['getter'];
  setInputValue: CreateRoom.InputValueState['setter'];
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

    function resultComponent() {
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

        return () => {};
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
    }

    return resultComponent;
  },
};

export declare module CreateRoom {
  export interface Context {
    redirectToSuccessUrl: () => void;
    redirectToFailedUrl: () => void;
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
