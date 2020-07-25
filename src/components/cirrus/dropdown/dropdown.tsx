import {createClassNamesFunction} from 'lib/classnames-function'

const cn = createClassNamesFunction<Cirrus | 'clicked'>()

export type ToggleShown = () => void

interface DropDownMenuProps {
  shown: boolean,
  toggleShown: ToggleShown
}

type MenuItemsChildren = JSX.FunctionalElement[]

export const getDropDownMenuCreater = (menuItemsChildren: MenuItemsChildren) => {
  const menuItems = (props: unknown) => menuItemsChildren.map(child => <li role="menuitem">{child(props)}</li>)

  return (props: DropDownMenuProps) => {
    return <>
        <a class={cn('nav-dropdown-link', props.shown && 'clicked')} onClick={props.toggleShown}>Click Me</a>
        <div id={'overlay'} style={{display: props.shown ? 'block' : 'none'}} onClick={props.toggleShown}></div>
        <ul class={cn('dropdown-menu', props.shown && 'dropdown-shown')} role="menu">
          {menuItems(props)}
        </ul>
      </>
  }
}

