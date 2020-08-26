import { ComponentCreater } from '../../typings/component-creater'
import clsx, { Clsx } from 'clsx'
import { css } from 'styled-jsx/css'
import { afterEffects, createRoot, createState, assignProps } from 'solid-js'

// export const emailRegex = '^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$'
export const emailRegex = '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$'

export const passwordRegex = '^[a-zA-Z0-9]{8,}$'

const cn: Clsx<Cirrus> = clsx

const { className: formRoot, styles: rootStyles } = createRoot(() => css.resolve`
  div {
    justify-content: center;
  }
`)

const {className: formRow, styles: rowStyles} = createRoot(() => css.resolve`
  div.row {
    margin: 0 20px;
    flex-shrink: 0;
    min-width: 180px;
  }
`)

const sizeSuffixMap = {
  xsmall: '-xsmall',
  small: '-small',
  large: '-large',
  xlarge: '-xlarge',
}

const buttonSizeSuffixMap = {
  ...sizeSuffixMap,
  xsmall: '-tiny'
}

const defaultSignUpContext: SignUpForm.FilledContext = {
  itemSize: false
}

const defaultSignUpProps: SignUpForm.FilledProps = {
  onSubmit: () => {}
}

type OnChange = JSX.DOMAttributes<HTMLInputElement>["onChange"]
type OnKeyDown = JSX.DOMAttributes<HTMLInputElement>["onKeyDown"]
type OnEnterKey = () => void

const DO_NOTHING = () => {}

const toEmail = Symbol()
const toPassword = Symbol()
const toConfirm = Symbol()
const toSubmit = Symbol()

const enterKeyCheck = (onEnterKey: OnEnterKey): OnKeyDown => ev => {
  if(ev.key === 'Enter' && ev.keyCode === 13) {
    console.log('EnterKeyCheck', onEnterKey)
    onEnterKey()
  }
}

function enterFocus<K extends number | string | symbol, T extends Record<K, OnEnterKey>>(focuser: T, key: K): OnKeyDown {
  return enterKeyCheck(() => setTimeout(focuser[key]))
}

const getFocuser = (element: HTMLElement | undefined) => HTMLElement.prototype.focus.bind(element)

export const SignUpForm: ComponentCreater<
  SignUpForm.Context,
  SignUpForm.Props
  > = {
  createComponent: contextArg => {
    const context = assignProps({}, defaultSignUpContext, contextArg)

    const {itemSize} = context

    const [sizedLabel, sizedInput, sizedButton] = (['label', 'input', 'btn'] as const)
      .map(item => {
        if(!itemSize) return item
        return `${item}${(item === 'btn' ? buttonSizeSuffixMap : sizeSuffixMap)[itemSize]}` as SizedFormItem
      })

    const labelClass = cn('form-group-label', sizedLabel, 'text-info')
    const inputClass = cn('form-group-input', sizedInput)
    const buttonClass = cn(sizedButton)


    return propsArg => {
      const props = assignProps({}, defaultSignUpProps, propsArg)

      const [state, setState] = createState({
        email: '',
        password: '',
        passwordConfirm: ''
      })

      const setEmail: OnChange = (event) => setState('email', event.target.value)
      const setPassword: OnChange = (event => setState('password', event.target.value))
      const setPasswordConfirm: OnChange = (event => setState('passwordConfirm', event.target.value))

      const [focuser, setFocuser] = createState({
        [toEmail]: DO_NOTHING,
        [toPassword]: DO_NOTHING,
        [toConfirm]: DO_NOTHING,
        [toSubmit]: DO_NOTHING
      })

      // createEffect(() => {
      //   console.log('Effect',
      //   '\n',
      //   focuser[toEmail],
      //   '\n',
      //   focuser[toPassword],
      //   '\n',
      //   focuser[toConfirm],
      //   '\n',
      //   focuser[toSubmit]
      //   )
      // })

      let emailRef: HTMLInputElement | undefined
      let passwordRef: HTMLInputElement | undefined
      let confirmRef: HTMLInputElement | undefined
      let submitRef: HTMLButtonElement | undefined

      afterEffects(() => {
        setFocuser(prev => {
          prev[toEmail] = getFocuser(emailRef)
          prev[toPassword] = getFocuser(passwordRef)
          prev[toConfirm] = getFocuser(confirmRef)
          prev[toSubmit] = getFocuser(submitRef)
        })
      })

      return <div class={`content ${formRoot}`}>
        <div class={`row ${formRow}`}>
          <div id="signup-email" class="form-group col-12">
            <div class={labelClass}>Email:</div>
            <input type="text" name="email" class={inputClass}
              required pattern={emailRegex}
              ref={emailRef}
              onKeyDown={enterFocus(focuser, toPassword)}
              value={state.email} onChange={setEmail}></input>
          </div>
        </div>
        <div class={`row ${formRow}`}>
          <div id="signup-password" class="form-group col-12">
            <div class={labelClass}>Password:</div>
            <input type="password" name="password" class={inputClass}
              required pattern={passwordRegex}
              ref={passwordRef}
              onKeyDown={enterFocus(focuser, toConfirm)}
              value={state.password} onChange={setPassword}></input>
          </div>
        </div>
        <div class={`row ${formRow}`}>
          <div id="signup-password-confirm" class="form-group col-12">
            <div class={labelClass}>Confirm:</div>
            <input type="password" name="password-confirm" class={inputClass}
              required pattern={passwordRegex}
              ref={confirmRef}
              onKeyDown={enterFocus(focuser, toSubmit)}
              value={state.passwordConfirm} onChange={setPasswordConfirm}></input>
          </div>
        </div>
        <div class={`row ${formRow}`}>
          <div id="signup-button" class="form-group col-12">
            <button class={`${buttonClass}`}
              ref={submitRef}
              onClick={() => props.onSubmit(state)}>Signup!</button>
          </div>
        </div>
        {rootStyles}
        {rowStyles}
      </div>
    }
  }
}

export declare module SignUpForm {
  export interface Context {
    itemSize?: 'xsmall' | 'small' | false | 'large' | 'xlarge'
  }

  export interface FilledContext extends Required<Context> {}

  export interface Props {
    onSubmit?: (state: SignUpState) => void
  }

  export interface FilledProps extends Required<Props> {}

  export interface SignUpState {
    email: string,
    password: string,
    passwordConfirm: string
  }
}
