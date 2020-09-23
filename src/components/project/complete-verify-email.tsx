import { Cirrus } from '@components/common/typings/cirrus-style';
import {
  inputRegex,
  loginMethodCreater,
} from '@components/common/util/input-field-utils';
import clsx, { Clsx } from 'clsx';
import { Component, createResource, createSignal, createState } from 'solid-js';
import { FirebaseAuthOwnUI } from './firebase-auth-own-ui';
import { FirebaseAuth } from './typings/firebase-sdk';

const [clearSignal] = createSignal();

const cn: Clsx<Cirrus> = clsx;

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

const getSubmitAction = (
  auth: FirebaseAuth,
  getInputValue: InputValueGetter,
  setInputValue: InputValueSetter,
  cookieKeyOfEmail: string,
): AuthComponentProps['submitAction'] => ({ passwordLength }) => {
  return loginMethodCreater({
    errorMessageHandler: (errorMessage) =>
      setInputValue('errorMessage', errorMessage),
    freezeValue: () => ({
      email: getInputValue.email,
      password: getInputValue.password,
      passConfirm: getInputValue.passConfirm,
    }),
    methodRunner: ({ email, password, passConfirm }) => ({
      validations: [
        {
          condition: inputRegex.emailRegex.test(email),
          errorMessage: () => 'Email is invalid format',
        },
        {
          condition: inputRegex.passwordRegex(passwordLength).test(password),
          errorMessage: () => 'Password is invalid format',
        },
        {
          condition: password === passConfirm,
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

            firstResult.user.updatePassword(password);

            // firebase
            //   .auth()
            //   .createUserWithEmailAndPassword(
            //     firstResult.user.email,
            //     getInputValue.password,
            //   )
            //   .then((secondResult) => console.log(secondResult))
            //   .catch((error) => {
            //     console.log(error.code);
            //     if (error.code === 'auth/') {
            //       firstResult.user!.updatePassword(getInputValue.password);
            //       return;
            //     }
            //     throw error;
            //   });
          })
          .catch((error) => {
            // Some error occurred, you can inspect the code: error.code
            // Common errors could be invalid email and invalid or expired OTPs.
            console.log(error.code);
            setInputValue('errorMessage', error.message);
          });
      },
    }),
  });
};

const defaultCookieKeyOfEmail = 'email-for-signin';

type UseFieldsInfo = FirebaseAuthOwnUI.UseFieldsInfo;

const defaultUseFields: UseFieldsInfo = {
  email: true,
  password: true,
  passConfirm: true,
};

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

      const [useFields, loadUseFields] = createResource<UseFieldsInfo>();

      loadUseFields(async () => {
        const signInMethods = await context.auth.fetchSignInMethodsForEmail(
          cookieEmailValue,
        );

        const alreadyEmailVerified = signInMethods.includes(
          firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD,
        );

        if (alreadyEmailVerified && cookieKeyOfEmail.length) {
          await context.auth.signInWithEmailLink(cookieKeyOfEmail);
          deleteEmailFromCookie(cookieKeyOfEmail);
        }

        const needPassword = !alreadyEmailVerified;

        return {
          email: true,
          password: needPassword,
          passConfirm: needPassword,
        };
      });

      // TODO dafault value
      const [getInputValue, setInputValue] = createState<
        FirebaseAuthOwnUI.InputValueScheme
      >({
        email: cookieEmailValue,
        password: '',
        passConfirm: '',
        infoMessage: '',
        errorMessage: '',
      });

      const submitAction = getSubmitAction(
        context.auth,
        getInputValue,
        setInputValue,
        cookieKeyOfEmail,
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
          useFields={useFields() ?? defaultUseFields}
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
