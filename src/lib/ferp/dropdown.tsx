import { getDropDownMenuCreater, ToggleShown } from '/components/cirrus/dropdown/dropdown';
import { Ferp, Inferno } from '/lib/deps'
import { staticOf } from '/lib/inferno-utils'

type DropDownStateKey = symbol | string | number

export type DropDownState = {
  shown: boolean
}

type DropDownStateMap<T extends DropDownStateKey> = {
  [Key in T]: DropDownState
}

type DropDownUpdateState<T extends DropDownStateKey> = Record<T, DropDownState>

type DropDownInitArg<T extends unknown, U extends DropDownStateKey, I extends T & DropDownStateMap<U> = T & DropDownStateMap<U>> = {
  key: U,
  preProcess?: (...preArgs: any) => I
  postProcess?: (postArg: I) => any
}

const DropDownMenu = getDropDownMenuCreater([
  staticOf(() => <a href="#">First Item</a>),
  staticOf(() => <a href="#">Second Item</a>),
  staticOf(() => <a href="#">Third Item</a>),
  staticOf(() => <a href="#">Fourth Item</a>),
])

type RenderEffect = (shown: boolean) => Ferp.NativeEffectMessage

const renderDropDownEffect = (parent: Element, toggleShown: ToggleShown): RenderEffect => shown => {
  Inferno.render(<DropDownMenu shown={shown} toggleShown={toggleShown} />, parent)
  return Ferp.effects.none()
}

type DropDownSubscriptionGetter = (selector: string) => Ferp.SubscriptionElement<[Element], any>

export const initDropDownReducer: <T extends unknown, U extends DropDownStateKey>
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

  function dropDownSubscription(parent: Element): Ferp.SubscriptionRunner{

    const curriedRenderEffect = (toggleShown: ToggleShown) => renderDropDownEffect(parent, toggleShown)

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
