import { ComponentCreater } from '../../typings/component-creater'
import { createFilteredClassFunction } from '@lib/filtered-class-function'
import { css } from 'styled-jsx/css'
import { createSignal, setDefaults, For, createRoot } from 'solid-js'

const cn = createFilteredClassFunction<Cirrus | 'clicked'>()

const { className: overlay, styles } = createRoot(() => css.resolve`
  div {
    width: 100%;
    height: 100%;
    cursor: default;
    background-color: transparent;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 5;
  }
`)

const defaultContext: DropDownMenu.FilledContext = {
  buttonText: 'Click Me',
}

const DO_NOTHING = () => {}

const defaultProps: DropDownMenu.FilledProps = {
  menuItems: [],
  onCleanup: DO_NOTHING
}

export const DropDownMenu: ComponentCreater<
    DropDownMenu.Context,
    DropDownMenu.Props
  > = {
  createComponent: (context = defaultContext) => {
    const fixedContext: DropDownMenu.FilledContext = {...defaultContext, ...context}

    return propsArg => {
      setDefaults(propsArg, defaultProps)

      const props = propsArg as DropDownMenu.FilledProps

      const [shown, setShown] = createSignal(false)

      const toggleShown = () => setShown(!shown())

      return <>
          <a class={cn('nav-dropdown-link', shown() && 'clicked')} onClick={toggleShown}>{fixedContext.buttonText}</a>
          <div class={overlay} style={{display: shown() ? 'block' : 'none'}} onClick={toggleShown}></div>
          <ul class={cn('dropdown-menu', shown() && 'dropdown-shown')} role="menu">
            <For each={(props as DropDownMenu.FilledProps).menuItems}>
              {item => <li>{item()}</li>}
            </For>
          </ul>
          {styles}
        </>
    }
  }
}

export declare module DropDownMenu {
  export interface Context {
    buttonText?: string,
  }

  export interface FilledContext extends Required<Context> {}

  export interface Props {
    menuItems?: JSX.FunctionElement[]
    onCleanup?: () => void
  }

  export interface FilledProps extends Required<Props> {}

  export type MenuItemsChildren = JSX.Element[]
}
