import {createFilteredClassFunction} from '/lib/filtered-class-function'
import {css} from 'styled-jsx/css'

const cn = createFilteredClassFunction<Cirrus | 'clicked'>()

export type ToggleShown = () => void

interface DropDownMenuProps {
  shown: boolean,
  toggleShown: ToggleShown
}

type MenuItemsChildren = JSX.FunctionalElement[]

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

export const getDropDownMenuCreater = (menuItemsChildren: MenuItemsChildren) => {
  const menuItems = (props: unknown) => menuItemsChildren.map(child => <li role="menuitem">{child(props)}</li>)

  return (props: DropDownMenuProps) => {
    return <>
        <a class={cn('nav-dropdown-link', props.shown && 'clicked')} onClick={props.toggleShown}>Click Me</a>
        <div class={overlay} style={{display: props.shown ? 'block' : 'none'}} onClick={props.toggleShown}></div>
        <ul class={cn('dropdown-menu', props.shown && 'dropdown-shown')} role="menu">
          {menuItems(props)}
        </ul>
        {styles}
      </>
  }
}
