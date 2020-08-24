import { HeaderMenu } from '@components/cirrus/common/header-dropdown'
import { SessionState, sessionState } from "./solid-firebase-auth"
import { createMemo } from "solid-js"

const createMenuItems = (sessionStateArg: SessionState) => createMemo(() => [
  () => <a>First Item</a>,
  () => <a>Second Item</a>,
  () => <a>Third Item</a>,
  () => <a>Fourth Item</a>,
])

const Component = HeaderMenu.createComponent()

const HeaderMenuComponent = () => {
  const menuItems = createMenuItems(sessionState)
  return <Component menuItems={menuItems()} />
}

export { HeaderMenuComponent as HeaderMenu }


