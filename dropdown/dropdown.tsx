import {createClassNamesFunction} from 'lib/classnames-function'
import { InfernoChild } from 'inferno'

const cn = createClassNamesFunction<Cirrus | 'clicked'>()

type ToggleShown = () => void

type MenuItemsChildren = InfernoChild[]

export const getDropDownMenuCreater = (menuItemsChildren: MenuItemsChildren) => {
  const menuItems = menuItemsChildren.map(child => <li role="menuitem">{child}</li>)

  return (props: { shown: boolean, toggleShown: ToggleShown }) => {
    return <>
        <a class={cn('nav-dropdown-link', props.shown && 'clicked')} onClick={props.toggleShown}>Click Me</a>
        <div id={'overlay'} style={{display: props.shown ? 'block' : 'none'}} onClick={props.toggleShown}></div>
        <ul class={cn('dropdown-menu', props.shown && 'dropdown-shown')} role="menu">
          {menuItems}
        </ul>
      </>
  }
}

