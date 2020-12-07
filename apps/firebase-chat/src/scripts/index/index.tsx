import { HeaderMenu } from '@components/project/header-menu';
import {
  sessionState,
  sessionStateChangedHandler,
} from '@lib/solid-firebase-auth';
import {
  createRouter,
  routingPaths,
  movePageFromPath,
} from '@components/project/router';
import { createComputed, createRoot, For } from 'solid-js';
import { render } from 'solid-js/web';
import { buttonize } from '@components/common/util/component-utils';

const dropDownTarget = document.getElementById('header-menu');

if (dropDownTarget) {
  render(() => <HeaderMenu />, dropDownTarget);
}

document.addEventListener('DOMContentLoaded', () => {
  const firebaseSdk = firebase.default;

  if (
    import.meta.env.MODE === 'production' &&
    import.meta.env.SNOWPACK_PUBLIC_USE_FIREBASE_ANALYTICS
  ) {
    firebaseSdk.analytics();
  }

  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });

  const auth = firebaseSdk.auth();

  if (
    import.meta.env.MODE !== 'production' &&
    import.meta.env.SNOWPACK_PUBLIC_AUTH_EMULATOR_PATH
  ) {
    auth.useEmulator(
      `${import.meta.env.SNOWPACK_PUBLIC_HTTP_LOCAL_HOST}${
        import.meta.env.SNOWPACK_PUBLIC_AUTH_EMULATOR_PATH
      }`,
    );
  }

  auth.onAuthStateChanged(sessionStateChangedHandler);

  auth.setPersistence(firebaseSdk.auth.Auth.Persistence.SESSION);

  createRoot(() =>
    createComputed(() =>
      console.log('Is Logged In =>', sessionState.loginState.isLoggedIn),
    ),
  );

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

  const Router = createRouter({ auth });

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
