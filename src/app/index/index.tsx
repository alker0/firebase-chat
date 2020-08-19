import { render } from 'solid-js/dom'
import { DropDown } from '@lib/auth-header-menu'
import { sessionStateChangedHandler } from '@lib/solid-firebase-auth'

const dropDownTarget = document.getElementById('dropdown-click')

if(dropDownTarget){
  render(() => <DropDown />, dropDownTarget)
}

document.addEventListener('DOMContentLoaded', function() {
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.messaging().requestPermission().then(() => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
  firebase.auth().onAuthStateChanged(sessionStateChangedHandler)

  const mockEmail = 'procyon@kyj.biglobe.ne.jp'
  const mockPassword = 'foofoo4bar'

  document.querySelectorAll('#signup-button').forEach(elm => {
    elm.addEventListener('click', ev => {
      firebase.auth().createUserWithEmailAndPassword(mockEmail, mockPassword).catch(err => {
        console.log(err.code)
        console.log(err.message)
      })
    })
  })

  try {
    let firebaseApp = firebase.app();
    let features = (['database', 'storage'] as const).filter(feature => typeof firebaseApp[feature] === 'function');
    document.getElementById('load')!.innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML = 'Error loading the Firebase SDK, check the console.';
  }
});
