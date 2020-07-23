import firebaseApp from 'firebase/app'
import * as inferno from 'inferno'
import {Ferp, EffectMessage} from 'ferp'
import {initDropDownReducer, DropDownState} from '../../lib/ferp/dropdown'

declare global {
  const firebase: typeof firebaseApp
  const Inferno: typeof inferno
}

const firebaseConfig = {
    apiKey: "AIzaSyCUDlFQJZdo3NOIAHSt8NmgF-gOHQ9ZkHg",
    authDomain: "talker-v1.firebaseapp.com",
    databaseURL: "https://talker-v1.firebaseio.com",
    projectId: "talker-v1",
    storageBucket: "talker-v1.appspot.com",
    messagingSenderId: "578515840439",
    appId: "1:578515840439:web:2b7905e64ae01d07778c32",
    measurementId: "G-S42EYX1LN4"
}

// Initialize Firebase

firebase.initializeApp(firebaseConfig)

firebase.analytics()

const ferp = (window as typeof window & {ferp: Ferp}).ferp

const {dropDownInit, dropDownSub} = initDropDownReducer(ferp)({
  key: Symbol('dropdown')
})

type AnyEffectFunction<T, U extends unknown=unknown> = (param: U) => [T, EffectMessage]

type UpdateFunction = AnyEffectFunction<DropDownState>

ferp.app({
  init: [dropDownInit, ferp.effects.none()],
  update: (message: UpdateFunction, state) => {
    return message(state)
  },
  subscribe: state => [
    dropDownSub('#dropdown-click')
  ]
})

document.addEventListener('DOMContentLoaded', function() {
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
  // // The Firebase SDK is initialized and available here!
  //
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.messaging().requestPermission().then(() => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
  //
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

  try {
    let app = firebase.app();
    let features = (['database', 'storage'] as const).filter(feature => typeof app[feature] === 'function');
    document.getElementById('load')!.innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML = 'Error loading the Firebase SDK, check the console.';
  }
});
