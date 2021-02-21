import { loginMethodCreater } from '@components/common/util/input-field-utils';
import { Cirrus } from '@alker/cirrus-types';
import clsx, { Clsx } from 'clsx';
import { createSignal, createState, Component } from 'solid-js';
import { FirebaseAuthOwnUI } from './firebase-auth-own-ui';
import { FirebaseAuth } from './typings/firebase-sdk';

const [clearSignal] = createSignal();

const cn: Clsx<Cirrus> = clsx;

type AuthComponentProps = FirebaseAuthOwnUI.Props<unknown>;

const getSubmitAction = ({
  auth,
  actionCode,
  emailPromise,
  formState,
  setFormState,
}: ResetPassword.SubmitActionArgs): AuthComponentProps['submitAction'] => ({
  passwordRegex,
}) => {
  return loginMethodCreater({
    errorMessageHandler: (errorMessage) =>
      setFormState('errorMessage', errorMessage),
    freezeValue: () => ({
      password: formState.password,
      passConfirm: formState.passConfirm,
    }),
    methodRunner: ({ password, passConfirm }) => ({
      validations: [
        {
          condition: passwordRegex.test(password),
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
          setFormState('errorMessage', error.message);
        }
      },
    }),
  });
};

const getActionInfoFromCurrentUrl = () => {
  const { searchParams } = new URL(window.location.href);
  return [searchParams.get('mode') ?? '', searchParams.get('oobCode') ?? ''];
};

export const ResetPassword = {
  createComponent: (
    context: ResetPassword.Context,
  ): Component<ResetPassword.Props> => {
    return () => {
      const [mode, actionCode] = getActionInfoFromCurrentUrl();

      if (mode !== 'resetPassword') context.redirectToFailedUrl();

      const [
        formState,
        setFormState,
      ] = createState<FirebaseAuthOwnUI.FormStateScheme>({
        email: '',
        password: '',
        passConfirm: '',
        infoMessage: 'Please input new password',
        errorMessage: '',
      });

      const emailPromise = context.auth
        .verifyPasswordResetCode(actionCode)
        .catch(() => {
          context.redirectToFailedUrl();
          return '';
        });

      const submitAction = getSubmitAction({
        auth: context.auth,
        formState,
        setFormState,
        actionCode,
        emailPromise,
      });

      return (
        <context.authComponent
          createFormState={() => [formState, setFormState]}
          clearSignal={clearSignal}
          inputMode={() => null}
          wholeOfBottom={(props) => (
            <div class={cn('row', 'input-control', 'px-0')}>
              <props.submitButton />
            </div>
          )}
          submitButtonProps={(disableWhenLoggedIn) => ({
            ...disableWhenLoggedIn,
            class: cn('animated', 'btn-primary'),
          })}
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

export declare module ResetPassword {
  export interface Context {
    auth: FirebaseAuth;
    authComponent: Component<AuthComponentProps>;
    redirectToSuccessUrl: () => void;
    redirectToFailedUrl: () => void;
    cookieKeyOfEmail?: string;
  }
  export interface Props {}

  export interface SubmitActionArgs
    extends FirebaseAuthOwnUI.FormStateAccessor {
    auth: FirebaseAuth;
    actionCode: string;
    emailPromise: Promise<string>;
  }
}
