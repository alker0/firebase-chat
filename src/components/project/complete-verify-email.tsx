import { styleUtils } from '@components/common/util/style-utils';
import { Cirrus } from '@components/common/typings/cirrus-style';
import {
  inputRegex,
  loginMethodCreater,
} from '@components/common/util/input-field-utils';
import clsx, { Clsx } from 'clsx';
import {
  Component,
  createMemo,
  createResource,
  createSignal,
  createState,
} from 'solid-js';
import { FirebaseAuthOwnUI } from './firebase-auth-own-ui';
import { FirebaseAuth } from './typings/firebase-sdk';

const [clearSignal] = createSignal();

const cn: Clsx<Cirrus> = clsx;

const noSidePadding = styleUtils.noSidePadding().className as Cirrus;

type AuthComponentProps = FirebaseAuthOwnUI.Props<unknown>;

type InputValueGetter = FirebaseAuthOwnUI.InputValueState['getter'];
type InputValueSetter = FirebaseAuthOwnUI.InputValueState['setter'];

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

const getSubmitAction = (
  auth: FirebaseAuth,
  getInputValue: InputValueGetter,
  setInputValue: InputValueSetter,
  cookieKeyOfEmail: string,
  getNeedPassword: () => boolean | undefined,
  redirectToSuccessUrl: () => void,
): AuthComponentProps['submitAction'] => ({ passwordRegex }) => {
  return loginMethodCreater({
    errorMessageHandler: (errorMessage) =>
      setInputValue('errorMessage', errorMessage),
    freezeValue: () => ({
      email: getInputValue.email,
      password: getInputValue.password,
      passConfirm: getInputValue.passConfirm,
      needPassword: getNeedPassword(),
    }),
    methodRunner: ({ email, password, passConfirm, needPassword }) => ({
      validations: [
        {
          condition: inputRegex.emailRegex.test(email),
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
            setInputValue('errorMessage', error.message);
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

      const [needPassword, loadNeedPassword] = createResource(true);

      const useFields = createMemo(() => ({
        email: true,
        password: Boolean(needPassword()),
        passConfirm: Boolean(needPassword()),
      }));

      loadNeedPassword(async () => {
        try {
          console.log(`Email Of Cookie: ${cookieEmailValue || '[Empty]'}`);

          const signInMethods = await getSignInMethods(
            context.auth,
            cookieEmailValue,
          );

          const alreadyEmailVerified = signInMethods.includes(
            firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
          );

          if (alreadyEmailVerified && cookieEmailValue.length) {
            await context.auth.signInWithEmailLink(cookieEmailValue);
            deleteEmailFromCookie(cookieKeyOfEmail);
            context.redirectToSuccessUrl();
          }

          return !alreadyEmailVerified;
        } catch (error) {
          console.log(error);
          return true;
        }
      });

      const [getInputValue, setInputValue] = createState<
        FirebaseAuthOwnUI.InputValueScheme
      >({
        email: cookieEmailValue,
        password: '',
        passConfirm: '',
        infoMessage: 'Please input for complete login',
        errorMessage: '',
      });

      const submitAction = getSubmitAction(
        context.auth,
        getInputValue,
        setInputValue,
        cookieKeyOfEmail,
        needPassword,
        context.redirectToSuccessUrl,
      );

      return (
        <context.authComponent
          getInputValueAccessor={() => [getInputValue, setInputValue]}
          clearSignal={clearSignal}
          inputMode={() => null}
          wholeOfBottom={(props) => (
            <div class={cn('row', 'input-control', noSidePadding)}>
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
