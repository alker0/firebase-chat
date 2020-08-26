import { ComponentCreater } from '../../typings/component-creater'
import { css } from 'styled-jsx/css'
import { createSignal, For, createRoot, assignProps, createEffect } from 'solid-js'
import clsx, { Clsx } from 'clsx'
import { Portal } from 'solid-js/dom'

type LinkButtonClass = 'LinkButtonClassName'

const { className: linkButton, styles: linkButtonStyles } = createRoot(() => css.resolve`
  a {
    z-index: 6;
  }
`) as {className: LinkButtonClass, styles: string}

const { className: overlay, styles: overlayStyles } = createRoot(() => css.resolve`
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

const cn: Clsx<Cirrus | LinkButtonClass> = clsx

const defaultContext: HeaderMenu.FilledContext = {
  buttonText: 'Click Me',
}

const DO_NOTHING = () => {}

const defaultProps: HeaderMenu.FilledProps = {
  buttonPlaceWhenNarrow: document.querySelector('.header-brand') ?? undefined,
  menuItems: [],
  onCleanup: DO_NOTHING
}

export const HeaderMenu: ComponentCreater<
    HeaderMenu.Context,
    HeaderMenu.Props
  > = {
  createComponent: (context = defaultContext) => {
    const fixedContext = assignProps({}, defaultContext, context)

    return propsArg => {

      const props = assignProps({}, defaultProps, propsArg)

      const [shown, setShown] = createSignal(false)
      const [headerNavShown, setHeaderNavShown] = createSignal(false)

      const toggleShown = () => setShown(!shown())
      const toggleHeaderNavShown = () => setHeaderNavShown(!headerNavShown())

      return <>
          <Portal mount={props.buttonPlaceWhenNarrow}>
            <div class={cn('nav-item', 'nav-btn', headerNavShown() && 'active')} onClick={toggleHeaderNavShown}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </Portal>
          <div class={cn('header-nav', headerNavShown() && 'active')}>
            <div class={cn('nav-right', 'nav-menu', 'u-text-center')}>
              <div class={cn('nav-item', 'has-sub', shown() && 'active')}>
                <a class={cn('nav-dropdown-link', linkButton)} onClick={toggleShown}>{fixedContext.buttonText}</a>
                <div class={overlay} style={{ display: shown() ? 'block' : 'none' }} onClick={toggleShown}></div>
                <ul class={cn('dropdown-menu', 'dropdown-animated', shown() && 'dropdown-shown')} role="menu">
                  <For each={props.menuItems}>
                    {item => <li>{item()}</li>}
                  </For>
                </ul>
                {overlayStyles}
              </div>
            </div>
          </div>
        </>
    }
  }
}

export declare module HeaderMenu {
  export interface Context {
    buttonText?: string,
  }

  export interface FilledContext extends Required<Context> {}

  export interface Props {
    buttonPlaceWhenNarrow?: Node
    menuItems?: JSX.FunctionElement[]
    onCleanup?: () => void
  }

  type FilledPropsType = Props & Required<Omit<Props, 'buttonPlaceWhenNarrow'>>

  export interface FilledProps extends FilledPropsType {}

  export type MenuItemsChildren = JSX.Element[]
}
