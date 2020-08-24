import 'solid-styled-jsx'
import { render, Suspense } from 'solid-js/dom'
import { HeaderMenu } from '@lib/auth-header-menu'
import { sessionStateChangedHandler } from '@lib/solid-firebase-auth'
import { createLazyFirebaseAuthUI } from '@lib/lazy-components/firebase-auth-ui'
import { lazy } from 'solid-js'

const dropDownTarget = document.getElementById('header-menu')

if (dropDownTarget) {
  render(() => <HeaderMenu />, dropDownTarget)
}

const ui = new firebaseui.auth.AuthUI(firebase.auth())
const LazyAuthUI = lazy(createLazyFirebaseAuthUI({ ui }))

document.addEventListener('DOMContentLoaded', function() {
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });

  firebase.auth().onAuthStateChanged(sessionStateChangedHandler)

  const authTarget = document.getElementById('firebase-auth-container')

  if (authTarget) {
    render(() => <Suspense fallback={<div>Loading...</div>}>
      <LazyAuthUI></LazyAuthUI>
    </Suspense>, authTarget)
  }

  try {
    let firebaseApp = firebase.app();
    let features = (['database', 'storage'] as const).filter(feature => typeof firebaseApp[feature] === 'function');
    document.getElementById('load')!.innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML = 'Error loading the Firebase SDK, check the console.';
  }
});
