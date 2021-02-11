import { PathMatchRouter } from '@components/common/case/path-match-router';
import { Redirect as RedirectCreator } from '@components/common/base/atoms/redirect';
import { inputRegex } from '@components/common/util/input-field-utils';
import { sessionState } from '@lib/solid-firebase-auth';
import { NON_EXISTANT_DOM_HREF } from '@lib/constants';
import { fullPath, pathWithoutHash } from '@lib/browser-utils';
import { logger } from '@lib/logger';
import { Cirrus } from '@alker/cirrus-types';
import clsx, { Clsx } from 'clsx';
import { createSignal, untrack } from 'solid-js';
import { TopMenu as TopMenuCreator } from './top-menu';
import { createLazyAuthUI } from './lazy/firebase-auth-own-ui';
import { createLazyCompleteVerifyEmail } from './lazy/complete-verify-email';
import { createLazyLoginForm } from './lazy/login-form';
import { createLazyCreateRoom } from './lazy/create-room';
import { createLazySearchRooms } from './lazy/search-rooms';
import { createLazyChatRoom } from './lazy/chat-room';
import {
  FirebaseAuth,
  FirebaseDb,
  FirebaseDbServerValue,
} from './typings/firebase-sdk';

const [routeSignal, sendRouteSignal] = createSignal(
  window.location.pathname,
  true,
);

window.addEventListener('popstate', () => {
  const prevWithoutHash = routeSignal().replace(/#[^?]+/, '');
  const currentWithoutHash = pathWithoutHash();

  if (window.location.hash === NON_EXISTANT_DOM_HREF) {
    window.history.replaceState(
      window.history.state,
      document.title,
      currentWithoutHash,
    );
  }

  logger.log(
    { prefix: 'Location' },
    '',
    window.location.href.replace(window.location.origin, ''),
  );

  if (currentWithoutHash !== prevWithoutHash) {
    logger.logFn({ prefix: 'Location' }, '', () => [
      routeSignal(),
      '->',
      window.location.pathname,
    ]);
    sendRouteSignal(window.location.pathname);
  }
});

export const thisOriginUrl = (path: string) =>
  `${window.location.origin}${path}`;

export const movePage = (url: string, state: Object | null = null) => {
  window.history.pushState(state, '', url);
  window.dispatchEvent(new Event('popstate'));
};

export const movePageFromPath = (path: string, state?: Object | null) =>
  movePage(thisOriginUrl(path), state);

export const routingPaths = {
  home: '/',
  chat: '/chat',
  login: '/login',
  completeVerifyEmail: '/complete-verify-email',
  resetPassword: '/reset-password',
  searchRooms: '/search-rooms',
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

export const createRouter = ({ auth, db, dbServerValue }: RouterContext) => {
  const routerContext: PathMatchRouter.Context = {
    loadingElement: () => <div>Loading...</div>,
    unmatchElement: () => <div>Any Pages Are Not Matched</div>,
  };

  const RouteComponent = PathMatchRouter.createComponent(routerContext);

  const TopMenu = TopMenuCreator.createComponent({
    headerContents: () => (
      <h1 class={cn('offset-center')}>Welcome To Talker</h1>
    ),
    getSessionButtonText: () =>
      sessionState.isLoggedIn ? 'Sign Out' : 'Sign Up',
    onSessionButtonClick: getSessionButtonHandler(auth),
    leftButtonText: 'Search Rooms',
    onLeftButtonClick: () => movePageFromPath(routingPaths.searchRooms),
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
    auth,
    authComponent: AuthComponent,
    redirectToSuccessUrl: redirectToHome,
    verifyEmailLinkUrl: thisOriginUrl(routingPaths.completeVerifyEmail),
    resetEmailLinkUrl: thisOriginUrl(routingPaths.resetPassword),
    emailCookieAge: 180,
  });

  const CompleteVerifyEmailComponent = createLazyCompleteVerifyEmail({
    auth,
    authComponent: AuthComponent,
    redirectToSuccessUrl: redirectToHome,
    redirectToFailedUrl: redirectToHome,
  });

  const CreateRoomComponent = createLazyCreateRoom({
    redirectToFailedUrl: redirectToHome,
    auth,
    db,
    dbServerValue,
    linkButtonView: {
      created: (ownRoomId) => {
        return {
          text: 'Go to your new chat room',
          onClick: () => {
            const { currentUser } = auth;
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

  const SearchRoomsComponent = createLazySearchRooms({
    auth,
    db,
    dbServerValue,
    onEnteringSucceeded: (targetRoom) =>
      movePageFromPath(
        `${routingPaths.chat}/${targetRoom.ownerId}/${targetRoom.ownRoomId}`,
        targetRoom,
      ),
  });

  const ChatRoomComponent = createLazyChatRoom({
    auth,
    db,
    redirectToFailedUrl: redirectToHome,
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
          matcher: () => fullPath().startsWith(routingPaths.chat),
          getComponent: () => <ChatRoomComponent />,
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
          matcher: routingPaths.searchRooms,
          getComponent: () => <SearchRoomsComponent />,
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
