import { ComponentCreater } from '../../../typings/component-creater'
import clsx, { Clsx } from 'clsx'
import { css } from 'styled-jsx/css'
import { afterEffects, createRoot, createState, assignProps, Component, SetStateFunction, For } from 'solid-js'
import { onlyWrap, OnlyWrap } from '../../util/only-wrap-style'
import { emailRegex, passwordRegex } from '../../util/inputRegex'

const cn: Clsx<Cirrus | OnlyWrap> = clsx

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

const defaultSignUpContext: SignUpForm.DefaultContext = {
  useFields: ['email', 'password', 'passConfirm'],
  focusMap: {
    email: 'password',
    password: 'passConfirm',
    passConfirm: 'submit'
  },
  itemSize: false
}

const defaultSignUpProps: SignUpForm.DefaultProps = {
  onSubmit: () => {}
}

const toEmail = Symbol()
const toPassword = Symbol()
const toPassConfirm = Symbol()
const toSubmit = Symbol()

const symbolMap = {
  email: toEmail,
  password: toPassword,
  passConfirm: toPassConfirm,
  submit: toSubmit
} as const

interface ValueState extends Record<keyof NativeFields, string> { }

interface ValueSetState {
  (key: keyof NativeFields): OnChange
}

interface FocuserSetState extends SetStateFunction<Record<keyof FocuserState, () => void>> { }

type SizedStyleClassKey = 'label' | 'input' | 'btn'

interface SizedStyleClassMap extends Record<SizedStyleClassKey, SizedFormItem> { }

interface RefMap {
  email: InputRef,
  password: InputRef,
  passConfirm: InputRef,
  submit: ButtonRef
}

type NativeField = Component<{
  fieldRef: RefMap,
  focuser: FocuserState,
  setFocuser: FocuserSetState
  sizedStyle: SizedStyleClassMap,
  focusTarget: number | string | symbol
  value: ValueState,
  setValue: ValueSetState
}>

interface NativeFields extends Record<'email' | 'password' | 'passConfirm', NativeField> {
  email: NativeField,
  password: NativeField,
  passConfirm: NativeField
}

type OnChange = JSX.DOMAttributes<HTMLInputElement>["onChange"]
type OnKeyDown = JSX.DOMAttributes<HTMLInputElement>["onKeyDown"]
type OnEnterKey = () => void

const DO_NOTHING = () => {}

type InputRef = HTMLInputElement | undefined
type ButtonRef = HTMLButtonElement | undefined

type FocuserState = {
  [toEmail]: () => void,
  [toPassword]: () => void,
  [toPassConfirm]: () => void,
  [toSubmit]: () => void
}

const enterKeyCheck = (onEnterKey: OnEnterKey): OnKeyDown => ev => {
  return;
  // if(ev.key === 'Enter' && ev.keyCode === 13) {
  //   console.log('EnterKeyCheck', onEnterKey)
  //   onEnterKey()
  // }
}

function enterFocus<K extends number | string | symbol, T extends Record<K, OnEnterKey>>(focuser: T, key: K): OnKeyDown {
  return enterKeyCheck(() => setTimeout(focuser[key]))
}

const getFocuser: (element: HTMLElement | undefined) => () => void = element => HTMLElement.prototype.focus.bind(element)

function valueSetter<T>(setValueState: (key: T, value: string) => void): (key: T) => OnChange {
  return key => ev => setValueState(key, ev.target.value)
}

const nativeFields: NativeFields = {
  email: props => <div id="signup-email" class={cn(onlyWrap)}>
      <div class={cn('input-control')}>
        <div class={cn('text-info', props.sizedStyle.label)}>Email</div>
        <input type="text" name="email" class={cn(props.sizedStyle.input)}
          required pattern={emailRegex}
          ref={props.fieldRef.email}
          onKeyDown={enterFocus(props.focuser, props.focusTarget)}
          value={props.value.email} onChange={props.setValue('email')}></input>
      </div>
    </div>,
  password: props => <div id="signup-password" class={cn(onlyWrap)}>
    <div class={cn('input-control')}>
      <div class={cn('text-info', props.sizedStyle.label)}>Password</div>
      <input type="password" name="password" class={cn(props.sizedStyle.input)}
        required pattern={passwordRegex}
        ref={props.fieldRef.password}
        onKeyDown={enterFocus(props.focuser, props.focusTarget)}
        value={props.value.password} onChange={props.setValue('password')}></input>
    </div>
  </div>,
  passConfirm: props => <div id="signup-password-confirm" class={cn(onlyWrap)}>
    <div class={cn('input-control')}>
      <div class={cn('text-info', props.sizedStyle.label)}>Confirm</div>
      <input type="password" name="password-confirm" class={cn(props.sizedStyle.input)}
        required pattern={passwordRegex}
        ref={props.fieldRef.passConfirm}
        onKeyDown={enterFocus(props.focuser, props.focusTarget)}
        value={props.value.passConfirm} onChange={props.setValue('passConfirm')}></input>
    </div>
  </div>,
}

export const SignUpForm: ComponentCreater<
  SignUpForm.Context | undefined,
  SignUpForm.Props
  > = {
  createComponent: (contextArg?) => {
    const context = assignProps({}, defaultSignUpContext, contextArg)

    const useFields = context.useFields.filter((elm, index, array) => array.indexOf(elm) === index)

    const {itemSize} = context

    const [sizedLabel, sizedInput, sizedButton] = (['label', 'input', 'btn'] as const)
      .map(item => {
        if(!itemSize) return item
        return `${item}${(item === 'btn' ? buttonSizeSuffixMap : sizeSuffixMap)[itemSize]}` as SizedFormItem
      })

    const refMap: RefMap = {
      email: undefined,
      password: undefined,
      passConfirm: undefined,
      submit: undefined
    }

    return propsArg => {
      const props = assignProps({}, defaultSignUpProps, propsArg)

      const { className: formRoot, styles: rootStyles } = createRoot(() => css.resolve`
        div {
          justify-content: center;
        }
      `)

      const [valueState, setValueState] = createState({
        email: '',
        password: '',
        passConfirm: ''
      })

      const [focuserState, setFocuserState] = createState({
        [toEmail]: DO_NOTHING,
        [toPassword]: DO_NOTHING,
        [toPassConfirm]: DO_NOTHING,
        [toSubmit]: DO_NOTHING
      })

      afterEffects(() => {
        setFocuserState({
          ...Object.fromEntries(useFields.map(name => [symbolMap[name], getFocuser(refMap[name])])),
          [toSubmit]: getFocuser(refMap.submit)
        })
      })

      return <form onSubmit={ev => props.onSubmit(valueState)}>
        <div class={cn('content')}>
          <For each={useFields}>
            {fieldName => {
              const Field = nativeFields[fieldName]
              return <Field
                fieldRef={refMap}
                focuser={focuserState}
                setFocuser={setFocuserState}
                focusTarget={context.focusMap[fieldName]}
                value={valueState}
                setValue={valueSetter(setValueState)}
                sizedStyle={{
                  label: sizedLabel,
                  input: sizedInput,
                  btn: sizedButton
                }}
              />
            }}
          </For>
          <div id="signup-button" class={cn(onlyWrap)}>
            <div class={cn('input-control')}>
              <button class={sizedButton}
                ref={refMap.submit}
                onClick={() => props.onSubmit(valueState)}>Signup!</button>
            </div>
          </div>
        </div>
      </form>
    }
  }
}

export declare module SignUpForm {

  export type NativeFieldName = keyof NativeFields
  export type NativeFieldNameWithSubmit = NativeFieldName | 'submit'

  export interface SignUpState {
    email: string,
    password: string,
    passConfirm: string
  }

  export interface Context {
    useFields?: NativeFieldName[],
    focusMap?: Record<NativeFieldName, NativeFieldNameWithSubmit>
    itemSize?: 'xsmall' | 'small' | false | 'large' | 'xlarge'
  }

  export interface DefaultContext extends Required<Context> {}

  export interface Props {
    onSubmit?: (state: SignUpState) => void
  }

  export interface DefaultProps extends Required<Props> {}
}
