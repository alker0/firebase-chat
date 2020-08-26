import { HeaderMenu } from '@components/cirrus/common/header-dropdown'
import { sessionState } from "./solid-firebase-auth"
import { createMemo } from "solid-js"

const createMenuItems = () => createMemo(() => [
  () => <a>First Item</a>,
  () => <a>Second Item</a>,
  () => <a>Third Item</a>,
  () => <a>Fourth Item</a>,
  () => <div>{sessionState.isLoggedIn}</div>
])

const Component = HeaderMenu.createComponent()

const HeaderMenuComponent = () => {

  const menuItems = createMenuItems()

  return <Component menuItems={menuItems()} />
}

export { HeaderMenuComponent as HeaderMenu }


