import { DropDownMenu } from '@components/cirrus/base/molecules/dropdown'
import { SessionState, sessionState } from "./solid-firebase-auth"
import { createMemo } from "solid-js"

const createMenuItems = (sessionState: SessionState) => createMemo(() => [
  () => <a>First Item</a>,
  () => <a>Second Item</a>,
  () => <a>Third Item</a>,
  () => <a>Fourth Item</a>,
])

const Component = DropDownMenu.createComponent()

export const DropDown = () => {
  const menuItems = createMenuItems(sessionState)
  return <Component menuItems={menuItems()} />
}


