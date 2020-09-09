import clsx, { Clsx } from 'clsx';
import { PathMatchRouter } from '@components/common/case/path-match-router';
import { Redirect as RedirectCreator } from '@components/common/base/atoms/redirect';
import { Cirrus } from '@components/common/typings/cirrus-style';
import { createSignal, untrack } from 'solid-js';
import { sessionState } from '@lib/solid-firebase-auth';
import { createLazyAuthUI } from './lazy/firebase-auth-own-ui';
import { TopMenu as TopMenuCreator } from './top-menu';

const cn: Clsx<Cirrus> = clsx;

const [routeSignal, sendRouteSignal] = createSignal('', true);

window.addEventListener('popstate', () => {
  console.log(window.location.href.replace(window.location.origin, ''));
  sendRouteSignal(window.location.pathname);
});

export const movePage = (url: string) => {
  window.history.pushState({}, '', url);
  window.dispatchEvent(new Event('popstate'));
};

export const movePageFromPath = (path: string) =>
  movePage(`${window.location.origin}${path}`);

export const routingPaths = {
  home: '/',
  chat: '/chat',
  auth: '/auth',
  searchRoom: '/search-room',
  createRoom: '/create-room',
};

const onSessionButtonClick = () => {
  if (sessionState.isLoggedIn) {
    firebase.auth().signOut();
  } else {
    movePageFromPath(routingPaths.auth);
  }
};

const TopMenu = TopMenuCreator.createComponent({
  headerContents: () => <h1 class={cn('offset-center')}>Welcome To Talker</h1>,
  getSessionButtonText: () =>
    sessionState.isLoggedIn ? 'Sign Out' : 'Sign Up',
  onSessionButtonClick,
  leftButtonText: 'Search Room',
  onLeftButtonClick: () => movePageFromPath(routingPaths.searchRoom),
  rightButtonText: 'Create Room',
  onRightButtonClick: () => movePageFromPath(routingPaths.createRoom),
});

const Redirect = RedirectCreator.createComponent({
  redirector: (path) => {
    movePageFromPath(path);
  },
});

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

export const createRouter = () => {
  const routerContext: PathMatchRouter.Context = {
    loadingElement: () => <div>Loading...</div>,
    unmatchElement: () => <div>Any Pages Not Found</div>,
  };

  const RouteComponent = PathMatchRouter.createComponent(routerContext);

  const AuthComponent = createLazyAuthUI();

  return () => (
    <RouteComponent
      routeSignal={routeSignal}
      routingTable={[
        {
          matcher: routingPaths.home,
          getComponent: () => <TopMenu />,
        },
        {
          matcher: routingPaths.chat,
          getComponent: () => <div>Chat Page</div>,
        },
        {
          matcher: ({ pathInfo }) => pathInfo().startsWith(routingPaths.auth),
          getComponent: () =>
            untrack(() => !sessionState.isLoggedIn) ? (
              <AuthComponent
                redirectToSuccessUrl={() => {
                  movePageFromPath(routingPaths.home);
                }}
              />
            ) : (
              <Redirect url={routingPaths.home} />
            ),
        },
        {
          matcher: routingPaths.searchRoom,
          getComponent: () => <div>Search Room Page</div>,
        },
        {
          matcher: routingPaths.createRoom,
          getComponent: () => <div>Create Room Page</div>,
        },
      ]}
    />
  );
};
