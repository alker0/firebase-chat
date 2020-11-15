import { NativeHandlerOf } from '@components/common/typings/component-utils';
import { batch } from 'solid-js';

export const inputRegexSource = {
  // email: RegExp('^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$')
  email: '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$',
  password: (length: number = 6) => `^[a-zA-Z0-9]{${length},}$`,
  strongPassword: (length: number = 8) =>
    `^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{${length},}$`,
} as const;

export const inputRegex = {
  email: RegExp(inputRegexSource.email),
  password: (length: number) => RegExp(inputRegexSource.password(length)),
  strongPassword: (length: number) =>
    RegExp(inputRegexSource.strongPassword(length)),
} as const;

export type CallableSubmit = NativeHandlerOf<
  JSX.FormHTMLAttributes<HTMLFormElement>['onSubmit']
>;

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

export function loginMethodCreater<T>(methodArg: {
  errorMessageHandler: (errorMessage: string) => void;
  freezeValue?: () => T;
  methodRunner: LoginMethodRunner<T>;
}): CallableSubmit {
  return (e) => {
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
        batch(() => whenValid(e));
      }
    });
  };
}
