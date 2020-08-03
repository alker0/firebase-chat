import {ComponentCreater} from '../../typings/component-creater'
import {createFilteredClassFunction} from '@lib/filtered-class-function'
import {css} from 'styled-jsx/css'

const cn = createFilteredClassFunction<Cirrus | 'clicked'>()

export type ToggleShown = () => void

interface DropDownMenuProps {
  shown: boolean,
  toggleShown: ToggleShown
}

const {className: overlay, styles} = css.resolve`
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
`

const defaultContext: DropDown.FilledContext = {
    menuItemsChildren: [],
    buttonText: 'Click Me'
}

export const DropDown: ComponentCreater<DropDown.Context> = {
  createComponent: (context = defaultContext) => {
    const fixedContext: DropDown.FilledContext = {...defaultContext, ...context}

    const menuItems = (props: unknown) =>
      fixedContext
      .menuItemsChildren
      .map(child => <li role="menuitem">{child(props)}</li>)

    return (props: DropDownMenuProps) => {
      return <>
          <a class={cn('nav-dropdown-link', props.shown && 'clicked')} onClick={props.toggleShown}>{fixedContext.buttonText}</a>
          <div class={overlay} style={{display: props.shown ? 'block' : 'none'}} onClick={props.toggleShown}></div>
          <ul class={cn('dropdown-menu', props.shown && 'dropdown-shown')} role="menu">
            {menuItems(props)}
          </ul>
          {styles}
        </>
    }
  }
}

export declare module DropDown {
  export type Context = {
    menuItemsChildren?: MenuItemsChildren,
    buttonText?: string
  }

  export type FilledContext = Required<Context>

  export type MenuItemsChildren = JSX.FunctionalElement[]
}
