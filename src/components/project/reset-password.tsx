import { Cirrus } from '@components/common/typings/cirrus-style';
import {
  inputRegex,
  loginMethodCreater,
} from '@components/common/util/input-field-utils';
import clsx, { Clsx } from 'clsx';
import { Component, createSignal, createState } from 'solid-js';
import { FirebaseAuthOwnUI } from './firebase-auth-own-ui';
import { FirebaseAuth } from './typings/firebase-sdk';

const [clearSignal] = createSignal();

const cn: Clsx<Cirrus> = clsx;

type AuthComponentProps = FirebaseAuthOwnUI.Props<unknown>;

type InputValueGetter = FirebaseAuthOwnUI.InputValueState['getter'];
type InputValueSetter = FirebaseAuthOwnUI.InputValueState['setter'];

const getSubmitAction = (
  auth: FirebaseAuth,
  getInputValue: InputValueGetter,
  setInputValue: InputValueSetter,
  actionCode: string,
  emailPromise: Promise<string>,
): AuthComponentProps['submitAction'] => ({ passwordLength }) => {
  return loginMethodCreater({
    errorMessageHandler: (errorMessage) =>
      setInputValue('errorMessage', errorMessage),
    freezeValue: () => ({
      password: getInputValue.password,
      passConfirm: getInputValue.passConfirm,
    }),
    methodRunner: ({ password, passConfirm }) => ({
      validations: [
        {
          condition: inputRegex.passwordRegex(passwordLength).test(password),
          errorMessage: () => 'Password is invalid format',
        },
        {
          condition: password === passConfirm,
          errorMessage: () => 'Password confirmation is not matching',
        },
      ],
      whenValid: async () => {
        try {
          const email = await emailPromise;

          await auth.confirmPasswordReset(actionCode, password);

          auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
          console.log(error.code);
          setInputValue('errorMessage', error.message);
        }
      },
    }),
  });
};

const getActionInfoFromCurrentUrl = () => {
  const { searchParams } = new URL(window.location.href);
  return [searchParams.get('mode') ?? '', searchParams.get('oobCode') ?? ''];
};

export const CompleteVerifyEmail = {
  createComponent: (
    context: CompleteVerifyEmail.Context,
  ): Component<CompleteVerifyEmail.Props> => {
    return () => {
      const [mode, code] = getActionInfoFromCurrentUrl();

      if (mode !== 'resetPassword') context.redirectToFailedUrl();

      const [getInputValue, setInputValue] = createState<
        FirebaseAuthOwnUI.InputValueScheme
      >({
        email: '',
        password: '',
        passConfirm: '',
        infoMessage: '',
        errorMessage: '',
      });

      const emailPromise = context.auth
        .verifyPasswordResetCode(code)
        .catch(() => {
          context.redirectToFailedUrl();
          return '';
        });

      emailPromise.then((email) => setInputValue('email', email));

      const submitAction = getSubmitAction(
        context.auth,
        getInputValue,
        setInputValue,
        code,
        emailPromise,
      );

      return (
        <context.authComponent
          getInputValueAccessor={() => [getInputValue, setInputValue]}
          clearSignal={clearSignal}
          inputMode={() => null}
          wholeOfBottom={(props) => (
            <div class={cn('row', 'input-control')}>
              <props.submitButton />
            </div>
          )}
          redirectToSuccessUrl={context.redirectToSuccessUrl}
          useFields={{
            email: false,
            password: true,
            passConfirm: true,
          }}
          submitAction={submitAction}
        />
      );
    };
  },
};

export declare module CompleteVerifyEmail {
  export interface Context {
    auth: FirebaseAuth;
    authComponent: Component<AuthComponentProps>;
    redirectToSuccessUrl: () => void;
    redirectToFailedUrl: () => void;
    cookieKeyOfEmail?: string;
  }
  export interface Props {}
}
