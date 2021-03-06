import {
  inputRegex,
  loginMethodCreater,
} from '@components/common/util/input-field-utils';
import { firebaseSdk } from '@lib/firebase-sdk';
import { logger } from '@lib/logger';
import { Cirrus } from '@alker/cirrus-types';
import clsx, { Clsx } from 'clsx';
import {
  createSignal,
  createState,
  createMemo,
  createResource,
  Component,
  Show,
} from 'solid-js';
import { FirebaseAuthOwnUI } from './firebase-auth-own-ui';
import { FirebaseAuth } from './typings/firebase-sdk';

const [clearSignal] = createSignal();

const cn: Clsx<Cirrus> = clsx;

type AuthComponentProps = FirebaseAuthOwnUI.Props<unknown>;

const getEmailValueFromCookie = (cookieKeyOfEmail: string) => {
  const [, emailValue] = document.cookie
    .split('; ')
    .map((pair) => pair.split('='))
    .find(([key]) => key === cookieKeyOfEmail) ?? ['', ''];

  return decodeURIComponent(emailValue);
};

const deleteEmailFromCookie = (cookieKeyOfEmail: string) => {
  document.cookie = `${cookieKeyOfEmail}=; max-age=-1; sameSite=strict;`;
};

const getSignInMethods = async (auth: FirebaseAuth, emailValue: string) => {
  if (emailValue.length) {
    return auth.fetchSignInMethodsForEmail(emailValue);
  } else {
    return [];
  }
};

const getSubmitAction = ({
  auth,
  cookieKeyOfEmail,
  getNeedPassword,
  redirectToSuccessUrl,
  formState,
  setFormState,
}: CompleteVerifyEmail.SubmitActionArgs): AuthComponentProps['submitAction'] => ({
  passwordRegex,
}) => {
  return loginMethodCreater({
    errorMessageHandler: (errorMessage) =>
      setFormState('errorMessage', errorMessage),
    freezeValue: () => ({
      email: formState.email,
      password: formState.password,
      passConfirm: formState.passConfirm,
      needPassword: getNeedPassword(),
    }),
    methodRunner: ({ email, password, passConfirm, needPassword }) => ({
      validations: [
        {
          condition: inputRegex.email.test(email),
          errorMessage: () => 'Email is invalid format',
        },
        {
          condition: !needPassword || passwordRegex.test(password),
          errorMessage: () => 'Password is invalid format',
        },
        {
          condition: !needPassword || password === passConfirm,
          errorMessage: () => 'Password confirmation is not matching',
        },
      ],
      whenValid: () => {
        auth
          .signInWithEmailLink(email, window.location.href)
          .then((firstResult) => {
            deleteEmailFromCookie(cookieKeyOfEmail);

            if (!firstResult.user) throw new Error('User Not Found');

            if (!firstResult.user.email)
              throw new Error("User's Email Not Found");

            if (needPassword) {
              firstResult.user.updatePassword(password);
            }

            redirectToSuccessUrl();
          })
          .catch((error) => {
            console.log(error.code);
            setFormState('errorMessage', error.message);
          });
      },
    }),
  });
};

const defaultCookieKeyOfEmail = 'email-for-signin';

export const CompleteVerifyEmail = {
  createComponent: (
    context: CompleteVerifyEmail.Context,
  ): Component<CompleteVerifyEmail.Props> => {
    const cookieKeyOfEmail =
      context.cookieKeyOfEmail ?? defaultCookieKeyOfEmail;

    return () => {
      if (!context.auth.isSignInWithEmailLink(window.location.href))
        context.redirectToFailedUrl();

      const cookieEmailValue = getEmailValueFromCookie(cookieKeyOfEmail);

      const [getNeedPassword] = createResource(
        () => true,
        async () => {
          try {
            logger.log(
              { prefix: 'Email Of Cookie' },
              '',
              cookieEmailValue || '[Empty]',
            );

            const signInMethods = await getSignInMethods(
              context.auth,
              cookieEmailValue,
            );

            const alreadyEmailVerified = signInMethods.includes(
              firebaseSdk.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
            );

            if (alreadyEmailVerified && cookieEmailValue.length) {
              await context.auth.signInWithEmailLink(cookieEmailValue);
              deleteEmailFromCookie(cookieKeyOfEmail);
              context.redirectToSuccessUrl();
            }

            logger.log(
              { prefix: 'Already Email Verified' },
              '',
              alreadyEmailVerified,
            );

            return !alreadyEmailVerified;
          } catch (error) {
            console.log(error);
            return true;
          }
        },
        false,
      );

      const useFields = createMemo(() => {
        if (getNeedPassword.loading) {
          return {
            email: false,
            password: false,
            passConfirm: false,
          };
        }
        const needPassword = Boolean(getNeedPassword());
        return {
          email: true,
          password: needPassword,
          passConfirm: needPassword,
        };
      });

      const [
        formState,
        setFormState,
      ] = createState<FirebaseAuthOwnUI.FormStateScheme>({
        email: cookieEmailValue,
        password: '',
        passConfirm: '',
        infoMessage: 'Please input for complete login',
        errorMessage: '',
      });

      const submitAction = getSubmitAction({
        auth: context.auth,
        cookieKeyOfEmail,
        redirectToSuccessUrl: context.redirectToSuccessUrl,
        getNeedPassword,
        formState,
        setFormState,
      });

      return (
        <Show when={!getNeedPassword.loading}>
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
            useFields={useFields()}
            submitAction={submitAction}
          />
        </Show>
      );
    };
  },
};

export declare module CompleteVerifyEmail {
  export interface Context
    extends Pick<SubmitActionArgs, 'auth' | 'redirectToSuccessUrl'> {
    authComponent: Component<AuthComponentProps>;
    redirectToFailedUrl: () => void;
    cookieKeyOfEmail?: string;
  }
  export interface Props {}

  export interface SubmitActionArgs
    extends FirebaseAuthOwnUI.FormStateAccessor {
    auth: FirebaseAuth;
    cookieKeyOfEmail: string;
    getNeedPassword: () => boolean | undefined;
    redirectToSuccessUrl: () => void;
  }
}
