import { HeaderMenu } from '@components/project/header-menu';
import {
  createRouter,
  routingPaths,
  movePageFromPath,
} from '@components/project/router';
import { buttonize } from '@components/common/util/component-utils';
import {
  sessionState,
  sessionStateChangedHandler,
} from '@lib/solid-firebase-auth';
import { IS_NOT_PRODUCTION, IS_PRODUCTION } from '@lib/constants';
import { logger, shouldLog } from '@lib/logger';
import { createComputed, createRoot } from 'solid-js';
import { render, For } from 'solid-js/web';

const dropDownTarget = document.getElementById('header-menu');

if (dropDownTarget) {
  render(() => <HeaderMenu />, dropDownTarget);
}

document.addEventListener('DOMContentLoaded', () => {
  const firebaseSdk = firebase.default;

  if (IS_PRODUCTION && import.meta.env.SNOWPACK_PUBLIC_USE_FIREBASE_ANALYTICS) {
    firebaseSdk.analytics();
  }

  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });

  const auth = firebaseSdk.auth();
  const dbFunc = firebaseSdk.database;

  if (IS_NOT_PRODUCTION) {
    if (import.meta.env.SNOWPACK_PUBLIC_AUTH_EMULATOR_PATH) {
      auth.useEmulator(
        import.meta.env.SNOWPACK_PUBLIC_AUTH_EMULATOR_PATH,
        // @ts-expect-error
        { disableWarnings: true },
      );
    }

    if (
      import.meta.env.SNOWPACK_PUBLIC_DATABASE_EMULATOR_HOST &&
      import.meta.env.SNOWPACK_PUBLIC_DATABASE_EMULATOR_PORT
    ) {
      dbFunc().useEmulator(
        import.meta.env.SNOWPACK_PUBLIC_DATABASE_EMULATOR_HOST,
        Number(import.meta.env.SNOWPACK_PUBLIC_DATABASE_EMULATOR_PORT),
      );

      dbFunc.enableLogging(true);

      if (import.meta.env.SNOWPACK_PUBLIC_DATABASE_FORCE_WEBSOCKETS) {
        (dbFunc as any).INTERNAL.forceWebSockets();
      }
    }
  }

  const db = dbFunc();

  auth.onAuthStateChanged(sessionStateChangedHandler);

  auth.setPersistence(firebaseSdk.auth.Auth.Persistence.SESSION);

  if (IS_NOT_PRODUCTION) {
    logger.log({ prefix: 'Env Var', defaultDo: false }, '', import.meta.env);

    if (shouldLog('Login State')) {
      createRoot(() =>
        createComputed(() =>
          logger.log(
            { prefix: 'Login State', skipCheck: true },
            'Is Logged In',
            sessionState.isLoggedIn,
          ),
        ),
      );
    }

    if (shouldLog('Focus In', undefined, false)) {
      document.body.addEventListener('focusin', (event) => {
        logger.logMultiLines({ prefix: 'Focus In', skipCheck: true }, [
          ['Previous', event.relatedTarget],
          ['Current', event.target],
        ]);
      });
    }

    if (shouldLog('Focus Out', undefined, false)) {
      document.body.addEventListener('focusout', (event) => {
        logger.logMultiLines({ prefix: 'Focus Out', skipCheck: true }, [
          ['Previous', event.relatedTarget],
          ['Current', event.target],
        ]);
      });
    }
  }

  const brandTarget = document.getElementById('header-brand-container');

  if (brandTarget) {
    render(
      () => (
        <a
          id="header-brand"
          {...buttonize(() => movePageFromPath(routingPaths.home), {
            role: 'link',
          })}
        >
          <h5 class="title">
            Talker
            <span role="img" aria-label="balloon">
              💬
              <style jsx>{`
                span[aria-label='balloon'] {
                  padding-left: 3px;
                  vertical-align: 30%;
                }
              `}</style>
            </span>
          </h5>
        </a>
      ),
      brandTarget,
    );
  }

  const Links = () => (
    <ul>
      <For each={[routingPaths.home, routingPaths.chat]}>
        {(path) => (
          <li>
            <button
              type="button"
              onClick={() => {
                movePageFromPath(path);
              }}
            >
              {path}
            </button>
          </li>
        )}
      </For>
    </ul>
  );

  const Router = createRouter({
    auth,
    db,
    dbServerValue: dbFunc.ServerValue,
  });

  const mainTarget = document.getElementById('main-contents');

  if (mainTarget) {
    render(
      () => (
        <>
          <Links />
          <Router />
        </>
      ),
      mainTarget,
    );
  }

  try {
    firebaseSdk.app();
    document.getElementById('load')!.innerHTML = 'Firebase app is loaded.';
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML =
      'Error Firebase App, check the console.';
  }
});
