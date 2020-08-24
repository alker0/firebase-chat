import { ComponentCreater } from '../../typings/component-creater'
import { css } from 'styled-jsx/css'
import { afterEffects, createRoot, setDefaults } from 'solid-js'

const { styles } = createRoot(() => css.resolve`
  .mdl-textfield__label {
    margin-left: unset;
    margin-top: unset;
    margin-right: unset;
    padding-top: 0.5rem;
    padding-left: 0.5rem;
  }

  .is-focused > .mdl-textfield__label {
    padding-top: 0;
  }
`)


const defaultProps: FirebaseAuthUI.FilledProps = {
  uiConfig: {
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ]
  }
}

const assertFilled = (context?: FirebaseAuthUI.Context): context is FirebaseAuthUI.FilledContext => {
  return Boolean(context)
}

export const FirebaseAuthUI: ComponentCreater<
    FirebaseAuthUI.Context,
    FirebaseAuthUI.Props
  > = {
  createComponent: context => {

    if(!assertFilled(context)) return _ => <div></div>

    return props => {
      setDefaults(props, defaultProps)

      let authRef: HTMLDivElement | undefined

      afterEffects(() => context.ui.start(authRef!, props.uiConfig))

      return <div style="display: contents;" ref={authRef}>
        {styles}
      </div>
    }
  }
}

export declare module FirebaseAuthUI {
  export interface Context {
    ui: firebaseui.auth.AuthUI
  }

  export interface FilledContext extends Required<Context> {}

  export interface Props {
    uiConfig?: firebaseui.auth.Config
  }

  export interface FilledProps extends Required<Props> {}
}

