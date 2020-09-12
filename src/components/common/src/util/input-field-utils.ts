import { batch } from 'solid-js';

export const inputRegex = {
  // email: RegExp('^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$')
  email: '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$',
  password: (length: number = 6) => `^[a-zA-Z0-9]{${length},}$`,
  strongPassword: (length: number = 8) =>
    `^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{${length},}$`,
  get emailRegex(): RegExp {
    return RegExp(inputRegex.email);
  },
  get passwordRegex(): (lengtn: number) => RegExp {
    return (length = 6) => RegExp(inputRegex.password(length));
  },
  get strongPasswordRegex(): (lengtn: number) => RegExp {
    return (length = 6) => RegExp(inputRegex.strongPassword(length));
  },
} as const;

type OnSubmit = NonNullable<
  JSX.FormHTMLAttributes<HTMLFormElement>['onSubmit']
>;
type CallableSubmit = JSX.EventHandler<HTMLFormElement, FocusEvent>;

export const loginMethodCreater = (methodArg: {
  errorMessageHandler: (errorMessage: string) => void;
  validations: { condition: () => boolean; errorMessage: () => string }[];
  whenValid: CallableSubmit;
}): OnSubmit => (e) => {
  e.preventDefault();
  batch(() => {
    methodArg.errorMessageHandler('');

    const {
      lastErrorMessage: resultErrorMessage,
      lastHasError: hasError,
    } = methodArg.validations.reduce(
      (
        { sep, lastErrorMessage: accumErrorMessage, lastHasError },
        { condition, errorMessage },
      ) => {
        if (condition()) {
          return { sep, lastErrorMessage: accumErrorMessage, lastHasError };
        }

        return {
          sep: '\n',
          lastErrorMessage: `${accumErrorMessage}${sep}${errorMessage()}`,
          lastHasError: true,
        };
      },
      { sep: '', lastErrorMessage: '', lastHasError: false },
    );

    if (hasError) {
      methodArg.errorMessageHandler(resultErrorMessage);
    } else {
      methodArg.whenValid(e);
    }
  });
};
