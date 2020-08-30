import { PathMatchRouter } from "@components/common/case/path-match-router"
import { FirebaseAuthUI } from "@components/common/domain/firebase-auth-ui"
import { createLazyFirebaseAuthUI } from "@components/project/firebase-auth-ui"
import { Component, createSignal } from "solid-js"

const [routeSignal, sendRouteSignal] = createSignal('', true)

window.addEventListener('popstate', ev => {
  console.log(window.location.href.replace(window.location.origin, ''))
  sendRouteSignal(window.location.pathname)
})

export const routingPaths = {
  home: '/home',
  chat: '/chat',
  auth: '/auth',
  searchRoom: '/search-room',
  createRoom: '/create-room'
}

const uiConfig: firebaseui.auth.Config = {
  signInOptions: [
    {
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
      fullLabel: 'Use Email and Passward'
    }
  ],
  callbacks: {
    signInSuccessWithAuthResult: (authResult, redirectURL) => {
      console.log('signInSuccessWithAuthResult', authResult, redirectURL)

      history.pushState({}, '', `.${routingPaths.home}`)
      window.dispatchEvent(new Event('popstate'))

      return false
    }
  }
}

export const createRouter = (context?: PathMatchRouter.Context) => {
  const routerContext: PathMatchRouter.Context = {
    loadingElement: () => <div>Loading...</div>,
    unmatchElement: () => <div>Any Pages Not Found</div>
  }

  const RouteComponent = PathMatchRouter.createComponent(routerContext)

  let AuthUIComponent: Component<FirebaseAuthUI.Props>

  return () => <RouteComponent routingTable={[
    {
      matcher: routingPaths.home,
      getComponent: () => <div>Home Page</div>
    },
    {
      matcher: routingPaths.chat,
      getComponent: () => <div>Chat Page</div>
    },
    {
      matcher: ({withHashAndQuery}) => withHashAndQuery().startsWith(routingPaths.auth),
      getComponent: () => {
        if(!AuthUIComponent) {
          const authUI = new firebaseui.auth.AuthUI(firebase.auth())
          AuthUIComponent = createLazyFirebaseAuthUI({ ui: authUI })
        }
        return <AuthUIComponent uiConfig={uiConfig} />
      }
    },
    {
      matcher: routingPaths.searchRoom,
      getComponent: () => <div>Search Room Page</div>
    },
    {
      matcher: routingPaths.createRoom,
    getComponent: () => <div>Create Room Page</div>
    },
  ]} routeSignal={routeSignal}></RouteComponent>
}
