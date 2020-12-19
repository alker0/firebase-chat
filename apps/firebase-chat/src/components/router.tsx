import clsx, { Clsx } from 'clsx';
import { PathMatchRouter } from '@components/common/case/path-match-router';
import { Redirect as RedirectCreator } from '@components/common/base/atoms/redirect';
import { Cirrus } from '@alker/cirrus-types';
import { inputRegex } from '@components/common/util/input-field-utils';
import { createSignal, untrack } from 'solid-js';
import { sessionState } from '@lib/solid-firebase-auth';
import { fullPath } from '@lib/routing-utils';
import { createLazyAuthUI } from './lazy/firebase-auth-own-ui';
import { TopMenu as TopMenuCreator } from './top-menu';
import { createLazyCompleteVerifyEmail } from './lazy/complete-verify-email';
import { createLazyLoginForm } from './lazy/login-form';
import { createLazyCreateRoom } from './lazy/create-room';
import {
  FirebaseAuth,
  FirebaseDb,
  FirebaseDbServerValue,
} from './typings/firebase-sdk';

const [routeSignal, sendRouteSignal] = createSignal('', true);

window.addEventListener('popstate', () => {
  console.log(window.location.href.replace(window.location.origin, ''));
  sendRouteSignal(window.location.pathname);
});

export const thisOriginUrl = (path: string) =>
  `${window.location.origin}${path}`;

export const movePage = (url: string) => {
  window.history.pushState({}, '', url);
  window.dispatchEvent(new Event('popstate'));
};

export const movePageFromPath = (path: string) => movePage(thisOriginUrl(path));

export const routingPaths = {
  home: '/',
  chat: '/chat',
  login: '/login',
  completeVerifyEmail: '/complete-verify-email',
  resetPassword: '/reset-password',
  searchRoom: '/search-room',
  createRoom: '/create-room',
};

const getSessionButtonHandler = (auth: FirebaseAuth) => () => {
  if (sessionState.isLoggedIn) {
    auth.signOut();
  } else {
    movePageFromPath(routingPaths.login);
  }
};

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

const cn: Clsx<Cirrus> = clsx;

export const createRouter = (context: RouterContext) => {
  const routerContext: PathMatchRouter.Context = {
    loadingElement: () => <div>Loading...</div>,
    unmatchElement: () => <div>Any Pages Not Found</div>,
  };

  const RouteComponent = PathMatchRouter.createComponent(routerContext);

  const TopMenu = TopMenuCreator.createComponent({
    headerContents: () => (
      <h1 class={cn('offset-center')}>Welcome To Talker</h1>
    ),
    getSessionButtonText: () =>
      sessionState.isLoggedIn ? 'Sign Out' : 'Sign Up',
    onSessionButtonClick: getSessionButtonHandler(context.auth),
    leftButtonText: 'Search Room',
    onLeftButtonClick: () => movePageFromPath(routingPaths.searchRoom),
    rightButtonText: 'Create Room',
    onRightButtonClick: () => movePageFromPath(routingPaths.createRoom),
  });

  const AuthComponent = createLazyAuthUI({
    passwordRegex: inputRegex.password(8),
    bottomWrapper: (props) => (
      <div class={cn('px-0')}>
        <props.bottomContents />
      </div>
    ),
  });

  const redirectToHome = () => movePageFromPath(routingPaths.home);

  const LoginFormComponent = createLazyLoginForm({
    auth: context.auth,
    authComponent: AuthComponent,
    redirectToSuccessUrl: redirectToHome,
    verifyEmailLinkUrl: thisOriginUrl(routingPaths.completeVerifyEmail),
    resetEmailLinkUrl: thisOriginUrl(routingPaths.resetPassword),
    emailCookieAge: 180,
  });

  const CompleteVerifyEmailComponent = createLazyCompleteVerifyEmail({
    auth: context.auth,
    authComponent: AuthComponent,
    redirectToSuccessUrl: redirectToHome,
    redirectToFailedUrl: redirectToHome,
  });

  const CreateRoomComponent = createLazyCreateRoom({
    redirectToFailedUrl: redirectToHome,
    auth: context.auth,
    db: context.db,
    dbServerValues: context.dbServerValue,
    linkButtonView: {
      created: (ownRoomId) => {
        return {
          text: 'Go to your new chat room',
          onClick: () => {
            const { currentUser } = context.auth;
            if (currentUser) {
              movePageFromPath(
                `${routingPaths.chat}/${currentUser.uid}/${ownRoomId}`,
              );
            } else {
              redirectToHome();
            }
          },
        };
      },
      alreadyFilled: {
        text: 'Edit your chat rooms',
        onClick: redirectToHome,
      },
      failed: {
        text: 'Back to home page',
        onClick: redirectToHome,
      },
    },
  });

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
          matcher: () => fullPath().startsWith(routingPaths.login),
          getComponent: () =>
            untrack(() => !sessionState.isLoggedIn) ? (
              <LoginFormComponent />
            ) : (
              <Redirect url={routingPaths.home} />
            ),
        },
        {
          matcher: () =>
            fullPath().startsWith(routingPaths.completeVerifyEmail),
          getComponent: () => <CompleteVerifyEmailComponent />,
        },
        {
          matcher: routingPaths.searchRoom,
          getComponent: () => <div>Search Room Page</div>,
        },
        {
          matcher: routingPaths.createRoom,
          getComponent: () => <CreateRoomComponent />,
        },
      ]}
    />
  );
};

export interface RouterContext {
  auth: FirebaseAuth;
  db: FirebaseDb;
  dbServerValue: FirebaseDbServerValue;
}
