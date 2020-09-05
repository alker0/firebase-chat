import { batch } from "solid-js"

export const inputRegex = {
  // email: '^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$'
  email: '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$',
  password: (length: number = 6) => `^[a-zA-Z0-9]{${length},}$`
}

type OnSubmit = NonNullable<JSX.FormHTMLAttributes<HTMLFormElement>["onSubmit"]>
type CallableSubmit = JSX.EventHandler<HTMLFormElement, FocusEvent>

export const loginMethodCreater = (methodArg: {
  errorMessageHandler: (errorMessage: string) => void,
  validations: { condition: () => boolean, errorMessage: () => string }[],
  whenValid: CallableSubmit
}): OnSubmit => e => {
  e.preventDefault()
  batch(() => {
    methodArg.errorMessageHandler('')
    const { lastErrorMessage, hasError } = methodArg
      .validations
      .reduce(({ sep, lastErrorMessage, hasError }, { condition, errorMessage }) => {
        if (condition()) {
          return { sep, lastErrorMessage, hasError }
        }
        else {
          return { sep: '\n', lastErrorMessage: `${lastErrorMessage}${sep}${errorMessage()}`, hasError: true }
        }
      }, { sep: '', lastErrorMessage: '', hasError: false })

    if (hasError) {
      methodArg.errorMessageHandler(lastErrorMessage)
    }
    else {
      methodArg.whenValid(e)
    }
  })
}
