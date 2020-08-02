import { Ferp } from '@lib/deps'
import { StateKey, StateMap, InitArg, UpdateState } from './state'
import { User } from 'firebase'

export type SessionState = {
  isLoggedIn: boolean,
  currentUser: User | null
}

type SessionStateMap<T extends StateKey> = StateMap<T, SessionState>

type SessionUpdateState<T extends StateKey> = UpdateState<T, SessionState>

type SignUpInitArg<
  TKey extends StateKey,
  TAny extends unknown,
  I extends TAny & SessionStateMap<TKey> = TAny & SessionStateMap<TKey>> = InitArg<TKey, TKey, TAny, I>

type RenderEffect = (shown: boolean) => Ferp.NativeEffectMessage

const renderDropDownEffect = (): RenderEffect => shown => {
  return Ferp.effects.none()
}

type FirebaseAuthSubscriptionGetter = (selector: string) => Ferp.SubscriptionElement<[Element]>

export const initSignUpReducer: <T extends StateKey, U extends unknown>
  (arg: SignUpInitArg<T, U>) => {
    sessionStateInit: SessionState,
    authSub: FirebaseAuthSubscriptionGetter
  }
  = arg => {

  const initDropDown = <T extends {}>(renderEffect: RenderEffect) => (state: T) => {
    return [
      {...state, [arg.key]: {
        isLoggedIn: false,
        currentUser: undefined
      }},
      renderEffect(false)
    ]
  }

  function signUpSubscription(parent: Element): Ferp.SubscriptionRunner{

    return dispatch => {
      // const toggleShown = () => {
      //   dispatch((state: SessionUpdateState<typeof arg.key>) => {
      //     const {} = !state[arg.key].
      //     return [
      //       {...state, [arg.key]: {shown: toggledShown}},
      //       Ferp.effects.none()
      //     ]
      //   })
      // }

      // window.requestAnimationFrame(() => dispatch(initDropDown(curriedRenderEffect(toggleShown))))

      return () => {}
    }
  }


  const getAuthSubscription: FirebaseAuthSubscriptionGetter = selector => {
    const parent = document.querySelector(selector)

    if(!parent) return false

    return [signUpSubscription, parent]
  }

  return {
    sessionStateInit: {
      isLoggedIn: false,
      currentUser: null
    },
    authSub: getAuthSubscription
  }
}

