import 'solid-styled-jsx'
import { render } from 'solid-js/dom'
import { HeaderMenu } from '@lib/auth-header-menu'
import { sessionStateChangedHandler } from '@lib/solid-firebase-auth'
import { FirebaseAuthUI } from '@components/cirrus/domain/firebase-auth-ui'

const dropDownTarget = document.getElementById('header-menu')

if (dropDownTarget) {
  render(() => <HeaderMenu />, dropDownTarget)
}

const ui = new firebaseui.auth.AuthUI(firebase.auth())

const AuthUI = FirebaseAuthUI.createComponent({ ui })

document.addEventListener('DOMContentLoaded', function() {
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });

  firebase.auth().onAuthStateChanged(sessionStateChangedHandler)

  const authTarget = document.getElementById('firebase-auth-container')

  if (authTarget) {
    render(() => <AuthUI />, authTarget)
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
