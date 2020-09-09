import 'solid-styled-jsx';
import { For, render } from 'solid-js/dom';
import { HeaderMenu } from '@lib/auth-header-menu';
import {
  sessionState,
  sessionStateChangedHandler,
} from '@lib/solid-firebase-auth';
import {
  createRouter,
  routingPaths,
  movePageFromPath,
} from '@components/project/router';
import { createEffect, createRoot } from 'solid-js';

const dropDownTarget = document.getElementById('header-menu');

if (dropDownTarget) {
  render(() => <HeaderMenu />, dropDownTarget);
}

document.addEventListener('DOMContentLoaded', () => {
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });

  firebase.auth().onAuthStateChanged(sessionStateChangedHandler);

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);

  createRoot(() =>
    createEffect(() => console.log('Is Logged In =>', sessionState.isLoggedIn)),
  );

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

  const Router = createRouter();

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
    const firebaseApp = firebase.app();
    const features = (['database', 'storage'] as const).filter(
      (feature) => typeof firebaseApp[feature] === 'function',
    );
    document.getElementById(
      'load',
    )!.innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML =
      'Error loading the Firebase SDK, check the console.';
  }
});
