import { afterEffects, Component } from 'solid-js';

export const EmailAuthFinish = {
  createComponent: (): Component<EmailAuthFinish.Props> => {
    return () => {
      afterEffects(() => {
        // Confirm the link is a sign-in with email link.
        if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
          const [, emailValue] = document.cookie
            .split('; ')
            .map((pair) => pair.split('='))
            .find(([key]) => key === 'email-for-signin') ?? ['', ''];

          let email: string | null = decodeURIComponent(emailValue);

          if (!email || email === '') {
            // eslint-disable-next-line no-alert
            email = window.prompt('Please provide your email for confirmation');
          }

          firebase
            .auth()
            .signInWithEmailLink(email!, window.location.href)
            .then((result) => {
              // Clear email from storage.
              document.cookie =
                'email-for-signin=; max-age=-1; sameSite=strict;';
              console.log(result);
            })
            .catch((error) => {
              // Some error occurred, you can inspect the code: error.code
              // Common errors could be invalid email and invalid or expired OTPs.
              console.log(error);
            });
        }
      });
      return '';
    };
  },
};

export declare module EmailAuthFinish {
  export interface Context {}

  export interface Props {}
}
