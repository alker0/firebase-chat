import { getDropDownMenuCreater } from 'components/cirrus/dropdown/dropdown';
import { SubscriptionRunner, Ferp, SubscriptionElement, NativeEffectMessage } from 'ferp'

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

type ToggleShown = () => void

const DropDownMenu = getDropDownMenuCreater([
  <a href="#">First Item</a>,
  <a href="#">Second Item</a>,
  <a href="#">Third Item</a>,
  <a href="#">Fourth Item</a>,
])

type RenderEffect = (shown: boolean) => NativeEffectMessage

const getRenderDropDownEffect = (effects: Ferp["effects"]) => (parent: Element, toggleShown: ToggleShown): RenderEffect => shown => {
  Inferno.render(<DropDownMenu shown={shown} toggleShown={toggleShown} />, parent)
  return effects.none()
}

type DropDownSubscriptionGetter = (selector: string) => SubscriptionElement<[Element], any>

export const initDropDownReducer: <T extends unknown, U extends DropDownStateKey>
    (ferp: Ferp) => (arg: DropDownInitArg<T, U>) => {
      dropDownInit: DropDownState,
      dropDownSub: DropDownSubscriptionGetter
    }
    = ferp => arg => {

  const {effects} = ferp

  const initDropDown = <T extends {}>(renderEffect: RenderEffect) => (state: T) => {
    return [
      {...state, [arg.key]: {shown: false}},
      renderEffect(false)
    ]
  }

  const renderDropDownEffect = getRenderDropDownEffect(effects)

  function dropDownSubscription(parent: Element): SubscriptionRunner{

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



