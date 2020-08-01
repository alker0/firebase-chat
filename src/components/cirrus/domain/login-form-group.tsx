import {ComponentCreater} from '../typings/component-creater'
import {createFilteredClassFunction} from '/lib/filtered-class-function'
import {css} from 'styled-jsx/css'

const cn = createFilteredClassFunction<Cirrus>()

const {className: formRoot, styles} = css.resolve`
  div {
    display: flex;
    justify-content: center;
  }
`

type SizedItem = Extract<
  ''
  | 'label-xsmall'
  | 'label-small'
  | 'label'
  | 'label-large'
  | 'label-xlarge'
  | 'input-xsmall'
  | 'input-small'
  | 'input'
  | 'input-large'
  | 'input-xlarge'
  | 'btn-tiny'
  | 'btn-small'
  | 'btn'
  | 'btn-large'
  | 'btn-xlarge'
  , Cirrus
  >

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

const defaultSignUpContext: Required<SignUpForm.Context> = {
  itemSize: false
}

export const SignUpForm: ComponentCreater<SignUpForm.Context> = {
  createComponent: (context = defaultSignUpContext) => {
    const {itemSize} = context

    const [sizedLabel, sizedInput, sizedButton] = (['label', 'input', 'btn'] as const)
      .map(item => {
        if(!itemSize) return item
        return `${item}${(item === 'btn' ? buttonSizeSuffixMap : sizeSuffixMap)[itemSize]}` as SizedItem
      })

    const labelClass = cn('form-group-label', sizedLabel, 'text-info')
    const inputClass = cn('form-group-input', sizedInput)
    const buttonClass = cn(sizedButton)

    return () =>
      <div id="signup-form" class={formRoot}>
        <div class="row">
          <div id="signup-email" class="form-group">
            <div class={labelClass}>Email:</div>
            <input type="text" name="email" class={inputClass}></input>
          </div>
        </div>
        <div class="row">
          <div id="signup-password" class="form-group">
            <div class={labelClass}>Password:</div>
            <input type="password" name="password" class={inputClass}></input>
          </div>
        </div>
        <div class="row">
          <button id="signup-button" class={buttonClass}>Signup!</button>
        </div>
        {styles}
      </div>
  }
}

export module SignUpForm {
  export type Context = {
    itemSize?: 'xsmall' | 'small' | false | 'large' | 'xlarge'
  }
}
