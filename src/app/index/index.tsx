import 'solid-styled-jsx'
import { render } from 'solid-js/dom'
import { DropDown } from '@lib/auth-header-menu'
import { sessionStateChangedHandler } from '@lib/solid-firebase-auth'
import { SighUpForm, SignUpSubmit, emailRegex, passwordRegex } from '@lib/auth-login-form'

const dropDownTarget = document.getElementById('header-menu')

if (dropDownTarget) {
  render(() => <DropDown />, dropDownTarget)
}

const mockEmail = 'procyon@kyj.biglobe.ne.jp'
const mockPassword = 'foofoo4bar'

const signUp: SignUpSubmit = ({email, password, passwordConfirm}) => {
  if (email.match(emailRegex) &&
    password.match(passwordRegex) &&
    password === passwordConfirm
  ) {
    console.log('valid', email, password, passwordConfirm);
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(err => {
      console.log(err.code)
      console.log(err.message)
    })
  }
  else {
    console.warn('invalid', email, password, passwordConfirm);
  }
}

const signUpFormTarget = document.getElementById('signup-form')

if (signUpFormTarget) {
  render(() => <SighUpForm onSubmit={signUp} />, signUpFormTarget)
}

document.addEventListener('DOMContentLoaded', function() {
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
  firebase.auth().onAuthStateChanged(sessionStateChangedHandler)

  try {
    let firebaseApp = firebase.app();
    let features = (['database', 'storage'] as const).filter(feature => typeof firebaseApp[feature] === 'function');
    document.getElementById('load')!.innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML = 'Error loading the Firebase SDK, check the console.';
  }
});
