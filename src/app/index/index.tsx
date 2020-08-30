import 'solid-styled-jsx'
import { For, render } from 'solid-js/dom'
import { HeaderMenu } from '@lib/auth-header-menu'
import { sessionState, sessionStateChangedHandler } from '@lib/solid-firebase-auth'
import { createRouter, routingPaths } from '@lib/router'
import { createEffect, createRoot } from 'solid-js'

const dropDownTarget = document.getElementById('header-menu')

if (dropDownTarget) {
  render(() => <HeaderMenu />, dropDownTarget)
}

document.addEventListener('DOMContentLoaded', function() {
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });

  firebase.auth().onAuthStateChanged(sessionStateChangedHandler)

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)

  createRoot(() => createEffect(() => console.log(sessionState.isLoggedIn)))

  const Links = () => <ul>
    <For each={[routingPaths.home, routingPaths.auth, routingPaths.chat, routingPaths.createRoom, routingPaths.searchRoom]}>
      {path => <li><a onClick={e => {
        e.preventDefault()
        history.pushState({}, '', `.${path}`)
        window.dispatchEvent(new Event('popstate'))
      }}>{path}</a></li>}
    </For>
    <li>
      <a onClick={e => {
        e.preventDefault()
        firebase.auth().signOut()
      }}>Logout</a>
    </li>
  </ul>

  const Router = createRouter()

  const mainTarget = document.getElementById('main-contents')

  if(mainTarget) {
    render(() => <>
      <Links />
      <Router />
    </>, mainTarget)
  }

  try {
    const firebaseApp = firebase.app();
    const features = (['database', 'storage'] as const).filter(feature => typeof firebaseApp[feature] === 'function');
    document.getElementById('load')!.innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML = 'Error loading the Firebase SDK, check the console.';
  }
});
