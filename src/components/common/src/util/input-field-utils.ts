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

export interface LoginValidationInfo {
  condition: boolean;
  errorMessage: () => string;
}

export interface LoginMethodRunner<T> {
  (freezed: T): {
    validations: LoginValidationInfo[];
    whenValid: CallableSubmit;
  };
}

export const loginMethodCreater = <T>(methodArg: {
  errorMessageHandler: (errorMessage: string) => void;
  freezeValue?: () => T;
  methodRunner: LoginMethodRunner<T>;
}): OnSubmit => (e) => {
  e.preventDefault();
  const freezedValue = methodArg.freezeValue?.();
  batch(() => {
    methodArg.errorMessageHandler('');

    const { validations, whenValid } = methodArg.methodRunner(freezedValue!);

    const {
      lastErrorMessage: resultErrorMessage,
      anyError: hasAnyError,
    } = validations.reduce(
      (
        { sep, lastErrorMessage: prevErrorMessage, anyError: errorInPrev },
        { condition, errorMessage },
      ) => {
        if (condition) {
          return {
            sep,
            lastErrorMessage: prevErrorMessage,
            anyError: errorInPrev,
          };
        }

        return {
          sep: '\n',
          lastErrorMessage: `${prevErrorMessage}${sep}${errorMessage()}`,
          anyError: true,
        };
      },
      { sep: '', lastErrorMessage: '', anyError: false },
    );

    if (hasAnyError) {
      methodArg.errorMessageHandler(resultErrorMessage);
    } else {
      whenValid(e);
    }
  });
};
