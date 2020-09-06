import { PathMatchRouter } from "@components/common/case/path-match-router"
import { Redirect as RedirectCreator } from "@components/common/base/atoms/redirect"
import { createLazyAuthUI } from "@components/project/firebase-auth-own-ui"
import { createSignal, untrack } from "solid-js"
import { sessionState } from "./solid-firebase-auth"
import { TopMenu as TopMenuCreator } from "@components/project/not-lazy/top-menu"

const [routeSignal, sendRouteSignal] = createSignal('', true)

window.addEventListener('popstate', ev => {
  console.log(window.location.href.replace(window.location.origin, ''))
  sendRouteSignal(window.location.pathname)
})

export const movePage = (url: string) => {
  history.pushState({}, '', url)
  window.dispatchEvent(new Event('popstate'))
}

const TopMenu = TopMenuCreator.createComponent()

const Redirect = RedirectCreator.createComponent({
  redirector: path => {
    movePage(`${location.origin}${path}`)
  }
})

export const routingPaths = {
  home: '/',
  chat: '/chat',
  auth: '/auth',
  searchRoom: '/search-room',
  createRoom: '/create-room'
}

// const uiConfig: firebaseui.auth.Config = {
//   signInOptions: [
//     {
//       provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
//       fullLabel: 'Use Email and Passward'
//     }
//   ],
//   callbacks: {
//     signInSuccessWithAuthResult: (authResult, redirectURL) => {
//       console.log('signInSuccessWithAuthResult', authResult, redirectURL)

//       history.pushState({}, '', `.${routingPaths.home}`)
//       window.dispatchEvent(new Event('popstate'))

//       return false
//     }
//   }
// }

export const createRouter = (context?: PathMatchRouter.Context) => {
  const routerContext: PathMatchRouter.Context = {
    loadingElement: () => <div>Loading...</div>,
    unmatchElement: () => <div>Any Pages Not Found</div>
  }

  const RouteComponent = PathMatchRouter.createComponent(routerContext)

  const AuthComponent = createLazyAuthUI()

  return () => <RouteComponent routeSignal={routeSignal} routingTable={[
    {
      matcher: routingPaths.home,
      getComponent: () => <TopMenu />
    },
    {
      matcher: routingPaths.chat,
      getComponent: () => <div>Chat Page</div>
    },
    {
      matcher: ({withHashAndQuery}) => withHashAndQuery().startsWith(routingPaths.auth),
      getComponent: () => untrack(() => !sessionState.isLoggedIn)
        ? <AuthComponent redirectToSuccessUrl={() => {
          movePage(`${location.origin}${routingPaths.home}`)
      }} />
        : <Redirect url={routingPaths.home} />
    },
    {
      matcher: routingPaths.searchRoom,
      getComponent: () => <div>Search Room Page</div>
    },
    {
      matcher: routingPaths.createRoom,
      getComponent: () => <div>Create Room Page</div>
    },
  ]}></RouteComponent>
}
