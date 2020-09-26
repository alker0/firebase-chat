import {
  inputRegex,
  loginMethodCreater,
} from '@components/common/util/input-field-utils';
import {
  buttonize,
  ClickHandle,
  DO_NOTHING,
} from '@components/common/util/component-utils';
import {
  createMultiDisposableStyle,
  styleUtils,
} from '@components/common/util/style-utils';
import { Cirrus } from '@components/common/typings/cirrus-style';
import {
  ComponentMemo,
  OnlyOptional,
} from '@components/common/typings/component-utils';
import clsx, { Clsx } from 'clsx';
import {
  assignProps,
  Component,
  createComputed,
  createMemo,
  createSignal,
  createState,
} from 'solid-js';
import { css } from 'styled-jsx/css';
import { FirebaseAuthOwnUI } from './firebase-auth-own-ui';
import { FirebaseAuth } from './typings/firebase-sdk';

const { classNames } = createMultiDisposableStyle<Cirrus>(() => [
  css.resolve`
    a {
      font-size: 0.9rem;
      margin-bottom: 1rem;
      cursor: pointer;
    }
  `,
  css.resolve`
    div {
      width: 1rem;
      margin-bottom: 1.2rem;
      cursor: default;
    }
  `,
]);

const bottomPadding = styleUtils.noSidePadding().className as Cirrus;

const [linkStyle, deviderStyle] = classNames;

const cn: Clsx<Cirrus> = clsx;

const SignUpModeText = 'SignUp';
const SignInWithPasswordModeText = 'SignInWithPassword';
const SignInWithVerifyEmailModeText = 'SignInWithVerifyEmailMode';
const ResetPasswordModeText = 'ResetPasswordMode';

const SignUpMode = Symbol(SignUpModeText);
const SignInWithPasswordMode = Symbol(SignInWithPasswordModeText);
const SignInWithVerifyEmailMode = Symbol(SignInWithVerifyEmailModeText);
const ResetPasswordMode = Symbol(ResetPasswordModeText);

type LoginMode =
  | typeof SignUpMode
  | typeof SignInWithPasswordMode
  | typeof SignInWithVerifyEmailMode
  | typeof ResetPasswordMode;

type AuthComponentProps = FirebaseAuthOwnUI.Props<LoginMode>;

type InputValueGetter = FirebaseAuthOwnUI.InputValueState['getter'];
type InputValueSetter = FirebaseAuthOwnUI.InputValueState['setter'];

const toggleLinkClass = cn('underline', linkStyle) as Cirrus;

const getLoginModeFromText = (modeText: string | null): LoginMode => {
  switch (modeText) {
    case SignUpModeText:
      return SignUpMode;
    case SignInWithPasswordModeText:
      return SignInWithPasswordMode;
    case SignInWithVerifyEmailModeText:
      return SignInWithVerifyEmailMode;
    case ResetPasswordModeText:
      return ResetPasswordMode;
    default:
      return SignUpMode;
  }
};

const getSignUpOrSignInTogglerButton = (
  getLoginMode: () => LoginMode,
  setLoginMode: (loginMode: LoginMode) => void,
): ComponentMemo => {
  // content-fluid
  const createButton = (
    buttonText: string,
    clickFn: ClickHandle<HTMLDivElement>,
  ) => () => (
    <div class={cn('col', 'btn-container', 'u-no-margin', 'u-no-padding')}>
      <div
        class={cn('btn', 'btn-animated', 'btn-info', 'outline')}
        {...buttonize(clickFn)}
      >
        {buttonText}
      </div>
    </div>
  );

  const whenSignUp = createButton('SignIn', () =>
    setLoginMode(SignInWithPasswordMode),
  );
  const whenSignIn = createButton('SignUp', () => setLoginMode(SignUpMode));

  const componentMemo = createMemo(
    () => (getLoginMode() === SignUpMode ? whenSignUp : whenSignIn),
    whenSignUp,
    true,
  );

  return {
    get Memo() {
      return componentMemo();
    },
  };
};

const getAnchorArea = (
  getLoginMode: () => LoginMode,
  setLoginMode: (mode: LoginMode) => void,
): ComponentMemo => {
  const viewNothing = () => null;
  const whenSignInWithPassword = () => (
    <div class={cn('row', 'ignore-screen', 'level')}>
      <div class={cn('col-5', 'ignore-screen', 'level-item', 'offset-left')}>
        <a
          class={cn('offset-left', toggleLinkClass)}
          {...buttonize(() => setLoginMode(ResetPasswordMode))}
        >
          Forgot Password ?
        </a>
      </div>
      <div class={cn('ignore-screen', 'level-item', deviderStyle)}>|</div>
      <div class={cn('col-5', 'ignore-screen', 'level-item', 'offset-right')}>
        <a
          class={cn('offset-right', toggleLinkClass)}
          {...buttonize(() => setLoginMode(SignInWithVerifyEmailMode))}
        >
          Sign In With Email Link
        </a>
      </div>
    </div>
  );
  const whenSignInWithEmailVerify = () => (
    <div class={cn('row', 'ignore-screen', 'level')}>
      <a
        class={cn('col', 'u-text-center', toggleLinkClass)}
        {...buttonize(() => setLoginMode(SignInWithPasswordMode))}
      >
        Sign In With Password
      </a>
    </div>
  );
  const whenResetPassword = () => (
    <div class={cn('row', 'ignore-screen', 'level')}>
      <a
        class={cn('col', 'u-text-center', toggleLinkClass)}
        {...buttonize(() => setLoginMode(SignInWithPasswordMode))}
      >
        Cancel
      </a>
    </div>
  );

  const componentMemo = createMemo(() => {
    switch (getLoginMode()) {
      case SignUpMode:
        return viewNothing;
      case SignInWithPasswordMode:
        return whenSignInWithPassword;
      case SignInWithVerifyEmailMode:
        return whenSignInWithEmailVerify;
      case ResetPasswordMode:
        return whenResetPassword;
      default:
        return viewNothing;
    }
  });

  return {
    get Memo() {
      return componentMemo();
    },
  };
};

const getUseFields = (getLoginMode: () => LoginMode) => {
  type UseFields = FirebaseAuthOwnUI.UseFieldsInfo;
  const useNothing: UseFields = {
    email: false,
    password: false,
    passConfirm: false,
  };
  const onlyEmail: UseFields = {
    ...useNothing,
    email: true,
  };
  const withPassword: UseFields = {
    email: true,
    password: true,
    passConfirm: false,
  };

  return createMemo(() => {
    switch (getLoginMode()) {
      case SignInWithPasswordMode:
        return withPassword;
      case SignUpMode:
      case SignInWithVerifyEmailMode:
        return onlyEmail;
      case ResetPasswordMode:
        return onlyEmail;
      default:
        return useNothing;
    }
  });
};

const getSubmitAction = (
  auth: FirebaseAuth,
  getInputValue: InputValueGetter,
  setInputValue: InputValueSetter,
  verifyEmailLinkUrl: string,
  resetEmailLinkUrl: string,
  cookieKeyOfEmail: string,
  emailCookieAge: number = 180,
): AuthComponentProps['submitAction'] => ({
  inputMode,
  passwordRegex,
  redirectToSuccessUrl,
}) => {
  const errorMessageHandler = (errorMessage: string) =>
    setInputValue('errorMessage', errorMessage);

  type FreezeWithPassword = {
    email: string;
    password: string;
  };

  type FreezeOnlyEmail = Pick<FreezeWithPassword, 'email'>;

  const freezeOnlyEmail = (): FreezeOnlyEmail => ({
    email: getInputValue.email,
  });

  const freezeWithPassword = (): FreezeWithPassword => ({
    email: getInputValue.email,
    password: getInputValue.password,
  });

  const emailValidation = (email: string) => ({
    condition: inputRegex.email.test(email),
    errorMessage: () => 'Email is invalid format',
  });

  switch (inputMode) {
    case SignUpMode:
    case SignInWithVerifyEmailMode:
      return loginMethodCreater({
        errorMessageHandler,
        freezeValue: freezeOnlyEmail,
        methodRunner: ({ email }) => ({
          validations: [emailValidation(email)],
          whenValid: () => {
            const actionCodeSettings = {
              handleCodeInApp: true,
              url: verifyEmailLinkUrl,
            };

            auth
              .sendSignInLinkToEmail(email, actionCodeSettings)
              .then(() => {
                setInputValue(
                  'infoMessage',
                  'Check your inbox for completing login',
                );

                document.cookie = `${cookieKeyOfEmail}=${encodeURIComponent(
                  email,
                )}; domain=.${
                  document.domain
                }; max-age=${emailCookieAge}; sameSite=strict;`;
              })
              .catch((error) => {
                console.log(error);
                console.log(error.code);
              });
          },
        }),
      });

    case SignInWithPasswordMode:
      return loginMethodCreater({
        errorMessageHandler,
        freezeValue: freezeWithPassword,
        methodRunner: ({ email, password }) => ({
          validations: [
            emailValidation(email),
            {
              condition: passwordRegex.test(password),
              errorMessage: () => 'Password is invalid format',
            },
          ],
          whenValid: () => {
            auth
              .signInWithEmailAndPassword(email, password)
              .then(() => {
                console.log('Sign In');
                redirectToSuccessUrl();
              })
              .catch((err) => {
                setInputValue('errorMessage', err.message);
                console.log(err.code);
              });
          },
        }),
      });

    case ResetPasswordMode:
      return loginMethodCreater({
        errorMessageHandler,
        freezeValue: freezeOnlyEmail,
        methodRunner: ({ email }) => ({
          validations: [emailValidation(email)],
          whenValid: () => {
            const actionCodeSettings = {
              handleCodeInApp: true,
              url: resetEmailLinkUrl,
            };

            auth
              .sendPasswordResetEmail(getInputValue.email, actionCodeSettings)
              .then(() => {
                setInputValue(
                  'infoMessage',
                  'Check your inbox for a password reset email.',
                );
              })
              .catch((error) => {
                console.log(error.code);
                setInputValue('errorMessage', error.message);
              });
          },
        }),
      });
    default:
      return DO_NOTHING;
  }
};

const defaultContext: Required<OnlyOptional<LoginForm.Context>> = {
  defaultLoginModeParamKey: 'default-login-mode',
  cookieKeyOfEmail: 'email-for-signin',
  emailCookieAge: 180,
};

export const LoginForm = {
  createComponent: (
    contextArg: LoginForm.Context,
  ): Component<LoginForm.Props> => {
    const context = assignProps({}, defaultContext, contextArg);

    return () => {
      const [getInputValue, setInputValue] = createState<
        FirebaseAuthOwnUI.InputValueScheme
      >({
        email: '',
        password: '',
        passConfirm: '',
        infoMessage: '',
        errorMessage: '',
      });

      const { searchParams } = new URL(window.location.href);

      const defaultLoginMode = getLoginModeFromText(
        searchParams.get(context.defaultLoginModeParamKey),
      );

      const [loginMode, setLoginMode] = createSignal<LoginMode>(
        defaultLoginMode,
      );

      createComputed(() => {
        loginMode();
        setInputValue('infoMessage', '');
      });

      const useFields = getUseFields(loginMode);

      const SignUpOrSignInToggler = getSignUpOrSignInTogglerButton(
        loginMode,
        setLoginMode,
      );

      const AnchorArea = getAnchorArea(loginMode, setLoginMode);

      const submitAction = getSubmitAction(
        context.auth,
        getInputValue,
        setInputValue,
        context.verifyEmailLinkUrl,
        context.resetEmailLinkUrl,
        context.cookieKeyOfEmail,
        context.emailCookieAge,
      );

      return (
        <context.authComponent
          getInputValueAccessor={() => [getInputValue, setInputValue]}
          clearSignal={loginMode}
          inputMode={loginMode}
          wholeOfBottom={(props) => (
            <>
              <div
                class={cn(
                  'row',
                  'input-control',
                  'btn-container',
                  bottomPadding,
                )}
              >
                <props.submitButton />
              </div>
              <div class={cn('row', bottomPadding)}>
                <SignUpOrSignInToggler.Memo />
              </div>
              <AnchorArea.Memo />
            </>
          )}
          submitButtonProps={(disableWhenLoggedIn) => ({
            ...disableWhenLoggedIn,
            class: cn('animated', 'btn-primary'),
          })}
          redirectToSuccessUrl={context.redirectToSuccessUrl}
          useFields={useFields()}
          submitAction={submitAction}
        />
      );
    };
  },
};

export declare module LoginForm {
  export interface Context {
    auth: FirebaseAuth;
    authComponent: Component<AuthComponentProps>;
    redirectToSuccessUrl: () => void;
    verifyEmailLinkUrl: string;
    resetEmailLinkUrl: string;
    defaultLoginModeParamKey?: string;
    cookieKeyOfEmail?: string;
    emailCookieAge?: number;
  }
  export interface Props {}
}
