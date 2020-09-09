import { Form } from '@components/common/base/form/form';
import { FormContainer } from '@components/common/base/form/form-container';
import { BasicInputField } from '@components/common/cirrus/common/basic-input-field';
import { LoginBasicBottom } from '@components/common/cirrus/domain/login-basic-bottom';
import { Cirrus } from '@components/common/typings/cirrus-style';
import {
  inputRegex,
  loginMethodCreater,
} from '@components/common/util/input-field-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import clsx, { Clsx } from 'clsx';
import {
  assignProps,
  Component,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  createState,
  SetStateFunction,
  untrack,
} from 'solid-js';
import { css } from 'styled-jsx/css';

type LinkMargin = 'This is Link Margin';
type BottomPadding = 'This is Bottom Margin';

const [linkMargin, bottomPadding] = createRoot(() => {
  return [
    css.resolve`
      a,
      button {
        margin-bottom: 1rem;
      }
    `,
    css.resolve`
      div {
        padding-right: 0;
      }
    `,
  ].map((pair) => pair.className);
}) as [LinkMargin, BottomPadding];

const cn: Clsx<Cirrus | LinkMargin | BottomPadding> = clsx;

const defaultContainerProps: Required<ContainerProps> = {
  ofForm: {},
  ofInternalContainer: {},
  ofInternalTitle: {},
  ofInternalBody: {},
  children: '',
};

const Container = FormContainer.createComponent({
  createContainer: () => (propsArg: ContainerProps) => {
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

// button.animated.btn-info.outline
const Bottom = LoginBasicBottom.createComponent();

const SignUpMode = Symbol('SignUp');
const SignInMode = Symbol('SignIn');

type LoginMode = typeof SignUpMode | typeof SignInMode;

const passwordLength = 8;

interface InputValueState {
  scheme: {
    email: string;
    password: string;
    passConfirm: string;
    errorMessage: string;
  };
  getter: InputValueState['scheme'];
  setter: SetStateFunction<InputValueState['scheme']>;
}

type OnSubmit = NonNullable<
  JSX.FormHTMLAttributes<HTMLFormElement>['onSubmit']
>;

const createLoginMethods = (methodArg: {
  getInputValue: InputValueState['getter'];
  setInputValue: InputValueState['setter'];
  redirectToSuccessUrl: () => void;
}): {
  signUp: OnSubmit;
  signIn: OnSubmit;
} => {
  const { getInputValue, setInputValue, redirectToSuccessUrl } = methodArg;
  const commonValidations = [
    {
      condition: () => inputRegex.emailRegex.test(getInputValue.email),
      errorMessage: () => 'Email is invalid format',
    },
    {
      condition: () =>
        inputRegex.passwordRegex(passwordLength).test(getInputValue.password),
      errorMessage: () => 'Password is invalid format',
    },
  ];

  const signUp = loginMethodCreater({
    errorMessageHandler: (errorMessage) =>
      setInputValue('errorMessage', errorMessage),
    validations: [
      ...commonValidations,
      {
        condition: () => getInputValue.password === getInputValue.passConfirm,
        errorMessage: () => 'Password confirmation is not matching',
      },
    ],
    whenValid: () => {
      firebase
        .auth()
        .createUserWithEmailAndPassword(
          getInputValue.email,
          getInputValue.password,
        )
        .then(() => {
          console.log('Sign Up');
          redirectToSuccessUrl();
        })
        .catch((err) => {
          setInputValue('errorMessage', err.message);
          console.log(err.code);
        });
    },
  });

  const signIn = loginMethodCreater({
    errorMessageHandler: (errorMessage) =>
      setInputValue('errorMessage', errorMessage),
    validations: commonValidations,
    whenValid: () => {
      firebase
        .auth()
        .signInWithEmailAndPassword(getInputValue.email, getInputValue.password)
        .then(() => {
          console.log('Sign In');
          redirectToSuccessUrl();
        })
        .catch((err) => {
          setInputValue('errorMessage', err.message);
          console.log(err.code);
        });
    },
  });

  return { signUp, signIn };
};

interface ContainerProps {
  ofForm?: JSX.FormHTMLAttributes<HTMLFormElement>;
  ofInternalContainer?: JSX.HTMLAttributes<HTMLDivElement>;
  ofInternalTitle?: JSX.HTMLAttributes<HTMLDivElement>;
  ofInternalBody?: JSX.HTMLAttributes<HTMLDivElement>;
  children?: JSX.HTMLAttributes<HTMLElement>['children'];
}

interface InputProps {
  loginMode: () => LoginMode;
  getInputValue: InputValueState['getter'];
  setInputValue: InputValueState['setter'];
}

interface BottomProps {
  loginMode: () => LoginMode;
  toggleLoginMode: () => void;
}

export const FirebaseAuthOwnUI = {
  createComponent: (): Component<FirebaseAuthOwnUI.Props> => {
    const FormComponent = Form.createComponent({
      container: Container,
      inputFields: (props: InputProps) => (
        <>
          <div class={cn('u-text-center', 'text-danger')}>
            {props.getInputValue.errorMessage}
          </div>
          <InputField
            labelText="Email:"
            ofInput={{
              name: 'email',
              type: 'text',
              required: true,
              pattern: inputRegex.email,
              value: props.getInputValue.email,
              onChange: (e) => props.setInputValue('email', e.target.value),
            }}
          />
          <InputField
            labelText="Password:"
            ofInput={{
              name: 'password',
              type: 'password',
              required: true,
              pattern: inputRegex.password(passwordLength),
              value: props.getInputValue.password,
              onChange: (e) => props.setInputValue('password', e.target.value),
            }}
          />
          {props.loginMode() === SignUpMode && (
            <InputField
              labelText="Confirm:"
              ofInput={{
                name: 'password-confirm',
                type: 'password',
                required: true,
                pattern: inputRegex.password(8),
                value: props.getInputValue.passConfirm,
                onChange: (e) =>
                  props.setInputValue('passConfirm', e.target.value),
              }}
            />
          )}
        </>
      ),
      bottomContents: (props: BottomProps) => (
        <Bottom
          ofWrapper={{
            class: cn('row', 'level', 'ignore-screen', bottomPadding),
          }}
          ofLink={{
            class: cn('underline', 'level-item', 'offset-left', linkMargin),
            href: '',
            onClick: (e) => {
              e.preventDefault();
              props.toggleLoginMode();
            },
            children: props.loginMode() === SignUpMode ? 'Sign In' : 'Sign Up',
          }}
          ofSubmit={{
            class: cn('animated', 'btn-primary', 'level-item', 'level-right'),
            disabled: sessionState.isLoggedIn,
          }}
        />
      ),
    });

    return (props) => {
      const [loginMode, setLoginMode] = createSignal<LoginMode>(SignUpMode);

      const [getInputValue, setInputValue] = createState<
        InputValueState['scheme']
      >({
        email: '',
        password: '',
        passConfirm: '',
        errorMessage: '',
      });

      const { signUp, signIn } = createLoginMethods({
        getInputValue,
        setInputValue,
        redirectToSuccessUrl: () => props.redirectToSuccessUrl(),
      });

      const onSubmit: () => OnSubmit = createMemo(() => {
        if (untrack(() => sessionState.isLoggedIn)) {
          return (e) => {
            e.preventDefault();
            console.log('Already Logged In');
            props.redirectToSuccessUrl();
          };
        }

        return loginMode() === SignUpMode ? signUp : signIn;
      });

      const toggleLoginMode = () =>
        setLoginMode(
          untrack(loginMode) === SignUpMode ? SignInMode : SignUpMode,
        );

      createEffect(() => {
        loginMode();
        setInputValue(['password', 'passConfirm', 'errorMessage'], '');
      });

      return (
        <FormComponent
          ofContainer={{
            containerProps: {
              ofForm: {
                onSubmit: onSubmit(),
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
            loginMode,
            getInputValue,
            setInputValue,
          }}
          ofBottomContents={{
            loginMode,
            toggleLoginMode,
          }}
        />
      );
    };
  },
};

export declare module FirebaseAuthOwnUI {
  export interface Context {}
  export interface Props {
    redirectToSuccessUrl: () => void;
  }
}