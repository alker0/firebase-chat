import { DropDown, ToggleShown } from '/components/cirrus/base/molecules/dropdown';
import { Ferp, Inferno } from '/lib/deps'
import { StateKey, StateMap, UpdateState, InitArg } from './state'

export type DropDownState = {
  shown: boolean
}

type DropDownStateMap<T extends StateKey> = StateMap<T, DropDownState>

type DropDownUpdateState<T extends StateKey> = UpdateState<T, DropDownState>

type DropDownInitArg<
  TKey extends StateKey,
  TAny extends unknown,
  I extends TAny & DropDownStateMap<TKey> = TAny & DropDownStateMap<TKey>
  > = InitArg<TKey, TKey, TAny, I> & {
    menuItems: DropDown.MenuItemsChildren
  }

type RenderEffect = (shown: boolean) => Ferp.NativeEffectMessage

const renderDropDownEffect = (
    parent: Element,
    toggleShown: ToggleShown,
    DropDownMenu: JSX.FunctionalElement
  ): RenderEffect => shown => {
  Inferno.render(<DropDownMenu shown={shown} toggleShown={toggleShown} />, parent)
  return Ferp.effects.none()
}

type DropDownSubscriptionGetter = (selector: string) => Ferp.SubscriptionElement<[Element], any>

export const initDropDownReducer: <T extends StateKey, U extends unknown>
    (arg: DropDownInitArg<T, U>) => {
      dropDownInit: DropDownState,
      dropDownSub: DropDownSubscriptionGetter
    }
    = arg => {

  const initDropDown = <T extends {}>(renderEffect: RenderEffect) => (state: T) => {
    return [
      {...state, [arg.key]: {shown: false}},
      renderEffect(false)
    ]
  }

  const DropDownMenu = DropDown.createComponent({
    menuItemsChildren: arg.menuItems
  })

  function dropDownSubscription(parent: Element): Ferp.SubscriptionRunner{

    const curriedRenderEffect = (toggleShown: ToggleShown) => renderDropDownEffect(parent, toggleShown, DropDownMenu)

    return dispatch => {
      const toggleShown = () => {
        dispatch((state: DropDownUpdateState<typeof arg.key>) => {
          const toggledShown = !state[arg.key].shown
          return [
            {...state, [arg.key]: {shown: toggledShown}},
            curriedRenderEffect(toggleShown)(toggledShown)
          ]
        })
      }

      window.requestAnimationFrame(() => dispatch(initDropDown(curriedRenderEffect(toggleShown))))

      return () => {}
    }
  }

  const getDropDownSubscription: DropDownSubscriptionGetter = selector => {
    const parent = document.querySelector(selector)

    if(!parent) return false

    return [dropDownSubscription, parent]
  }

  return {
    dropDownInit: {
      shown: false
    },
    dropDownSub: getDropDownSubscription
  }
}
