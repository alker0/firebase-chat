import { PathMatchRouter } from "@components/common/case/path-match-router"
import { FirebaseAuthUI } from "@components/common/domain/firebase-auth-ui"
import { Component } from "solid-js"

export const routingPaths = {
  home: '/home',
  chat: '/chat',
  auth: '/auth',
  searchRoom: '/search-room',
  createRoom: '/create-room'
}

export const createRouter = (context: PathMatchRouter.Context) => {
  const routerContext: PathMatchRouter.Context = {
    loadingElement: () => <div>Loading...</div>,
    unmatchElement: () => <div>Any Pages Not Found</div>
  }

  const RouteComponent = PathMatchRouter.createComponent(routerContext)

  let AuthUIComponent: Component<FirebaseAuthUI.Props>

  return () => <RouteComponent routingTable={[
    {
      matchPath: routingPaths.home,
      getComponent: () => <div>Home Page</div>
    },
    {
      matchPath: routingPaths.chat,
      getComponent: () => <div>Chat Page</div>
    },
    {
      matchPath: routingPaths.auth,
      getComponent: () => {
        if(!AuthUIComponent) {
          const authUI = new firebaseui.auth.AuthUI(firebase.auth())
          AuthUIComponent = FirebaseAuthUI.createComponent({ui: authUI})
        }
        return <AuthUIComponent />
      }
    },
    {
      matchPath: routingPaths.searchRoom,
      getComponent: () => <div>Search Room Page</div>
    },
    {
      matchPath: routingPaths.createRoom,
      getComponent: () => <div>Create Room Page</div>
    },
  ]}></RouteComponent>
}
