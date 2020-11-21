import { Form } from '@components/common/base/form/form';
import { FormContainer } from '@components/common/base/form/form-container';
import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import { LoginBasicBottom } from '@components/common/cirrus/domain/login-basic-bottom';
import { memoHandler } from '@components/common/util/component-utils';
import { Cirrus } from 'cirrus-types';
import {
  EventArg,
  EventArgOf,
  OnlyOptional,
} from '@components/common/typings/component-utils';
import {
  CallableSubmit,
  inputRegex,
  inputRegexSource,
} from '@components/common/util/input-field-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import clsx, { Clsx } from 'clsx';
import {
  assignProps,
  Component,
  createComputed,
  createMemo,
  createState,
  SetStateFunction,
  State,
  untrack,
} from 'solid-js';

const cn: Clsx<Cirrus> = clsx;

const defaultContainerProps: Required<ContainerProps> = {
  ofForm: {},
  ofInternalContainer: {},
  ofInternalTitle: {},
  ofInternalBody: {},
  children: '',
};

const Container = FormContainer.createComponent({
  createContainer: () => (propsArg: ContainerProps = {}) => {
    const props = assignProps({}, defaultContainerProps, propsArg);
    return (
      <form {...(props.ofForm ?? {})}>
        <div {...props.ofInternalContainer}>
          <div {...props.ofInternalTitle} />
          <div {...props.ofInternalBody} children={props.children} />
        </div>
      </form>
    );
  },
});

const InputField = BasicInputField.createComponent({
  fieldSize: 'small',
});

interface OuterBottomProps extends LoginBasicBottom.BottomWholeProps {
  // eslint-disable-next-line react/no-unused-prop-types
  bottomComponent: Component<LoginBasicBottom.BottomWholeProps>;
}

interface InnerBottomProps extends LoginBasicBottom.BottomWholePropsOpts {
  // eslint-disable-next-line react/no-unused-prop-types
  bottomComponent: Component<LoginBasicBottom.BottomWholeProps>;
  // eslint-disable-next-line react/no-unused-prop-types
  ofSubmit: JSX.InputHTMLAttributes<HTMLInputElement>;
}

// button.animated.btn-info.outline
const Bottom = LoginBasicBottom.createComponent({
  whole: (props: OuterBottomProps) => (
    <props.bottomComponent submitButton={props.submitButton} />
  ),
});

interface ContainerProps {
  ofForm?: JSX.FormHTMLAttributes<HTMLFormElement>;
  ofInternalContainer?: JSX.HTMLAttributes<HTMLDivElement>;
  ofInternalTitle?: JSX.HTMLAttributes<HTMLDivElement>;
  ofInternalBody?: JSX.HTMLAttributes<HTMLDivElement>;
  children?: JSX.HTMLAttributes<HTMLElement>['children'];
}

interface InputProps {
  getInputValue: FirebaseAuthOwnUI.InputValueState['getter'];
  setInputValue: FirebaseAuthOwnUI.InputValueState['setter'];
  useFields: {
    email: boolean;
    password: boolean;
    passConfirm: boolean;
  };
}

export const defaultContext: Required<FirebaseAuthOwnUI.Context> = {
  passwordRegex: inputRegex.password(6),
  bottomWrapper: (props) => props.bottomContents,
};

const defaultProps: Required<OnlyOptional<FirebaseAuthOwnUI.Props<unknown>>> = {
  getInputValueAccessor: () =>
    createState<FirebaseAuthOwnUI.InputValueState['scheme']>({
      email: '',
      password: '',
      passConfirm: '',
      infoMessage: '',
      errorMessage: '',
    }),
  submitButtonProps: (disableWhenLoggedIn) => disableWhenLoggedIn,
};

export const FirebaseAuthOwnUI = {
  createComponent: (contextArg: FirebaseAuthOwnUI.Context = {}) => {
    const context = assignProps({}, defaultContext, contextArg);

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
            labelText="Email:"
            ofInput={{
              name: 'email',
              id: 'input-email',
              type: 'text',
              required: true,
              pattern: inputRegexSource.email,
              value: props.getInputValue.email,
              onChange: (e: EventArg<HTMLInputElement>) =>
                props.setInputValue('email', e.target.value),
            }}
          />
          {props.useFields.password && (
            <InputField
              labelText="Password:"
              ofInput={{
                name: 'password',
                id: 'input-password',
                type: 'password',
                required: true,
                pattern: context.passwordRegex.source,
                value: props.getInputValue.password,
                onChange: (e: EventArg<HTMLInputElement>) =>
                  props.setInputValue('password', e.target.value),
              }}
            />
          )}
          {props.useFields.passConfirm && (
            <InputField
              labelText="Confirm:"
              ofInput={{
                name: 'password-confirm',
                id: 'input-password-confirm',
                type: 'password',
                required: true,
                pattern: context.passwordRegex.source,
                value: props.getInputValue.passConfirm,
                onChange: (e: EventArg<HTMLInputElement>) =>
                  props.setInputValue('passConfirm', e.target.value),
              }}
            />
          )}
        </>
      ),
      bottomContents: (props: InnerBottomProps) => (
        <context.bottomWrapper
          bottomContents={() => (
            <Bottom
              ofWhole={{
                bottomComponent: props.bottomComponent,
              }}
              ofSubmit={props.ofSubmit}
            />
          )}
        />
      ),
    });

    function resultComponent<T>(propsArg: FirebaseAuthOwnUI.Props<T>) {
      const props = assignProps({}, defaultProps, propsArg);

      const [getInputValue, setInputValue] = props.getInputValueAccessor();

      const onSubmit: () => CallableSubmit = createMemo(() => {
        if (untrack(() => sessionState.loginState.isLoggedIn)) {
          return (e: EventArgOf<CallableSubmit>) => {
            e.preventDefault();
            console.log('Already Logged In');
            props.redirectToSuccessUrl();
          };
        }

        return props.submitAction({
          inputMode: props.inputMode(),
          passwordRegex: context.passwordRegex,
          redirectToSuccessUrl: props.redirectToSuccessUrl,
        });
      });

      createComputed(() => {
        props.clearSignal();
        setInputValue(['password', 'passConfirm', 'errorMessage'], '');
      });

      return (
        <FormComponent
          ofContainer={{
            containerProps: {
              ofForm: {
                onSubmit: memoHandler(onSubmit),
                class: cn('content', 'frame'),
              },
              ofInternalContainer: {
                class: cn('content'),
              },
              ofInternalTitle: {
                class: cn('frame__header'),
              },
              ofInternalBody: {
                class: cn('frame__body'),
              },
            },
          }}
          ofInputFields={{
            getInputValue,
            setInputValue,
            useFields: props.useFields,
          }}
          ofBottomContents={{
            bottomComponent: props.wholeOfBottom,
            ofSubmit: props.submitButtonProps({
              disabled: sessionState.loginState.isLoggedIn,
            }),
          }}
        />
      );
    }

    return resultComponent;
  },
};

export declare module FirebaseAuthOwnUI {
  export interface Context {
    passwordRegex?: RegExp;
    bottomWrapper?: Component<{
      bottomContents: JSX.FunctionElement;
    }>;
  }
  export interface Props<T> {
    getInputValueAccessor?: () => InputValueAccessor;
    redirectToSuccessUrl: () => void;
    useFields: UseFieldsInfo;
    inputMode: () => T;
    clearSignal: () => unknown;
    wholeOfBottom: Component<LoginBasicBottom.BottomWholeProps>;
    submitButtonProps?: (disableWhenLoggedIn: {
      disabled: boolean;
    }) => JSX.InputHTMLAttributes<HTMLInputElement>;
    submitAction: (arg: {
      inputMode: T;
      passwordRegex: RegExp;
      redirectToSuccessUrl: () => void;
    }) => CallableSubmit;
  }

  export interface UseFieldsInfo {
    email: boolean;
    password: boolean;
    passConfirm: boolean;
  }

  export interface InputValueState {
    scheme: {
      email: string;
      password: string;
      passConfirm: string;
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
