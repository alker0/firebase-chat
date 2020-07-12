import * as firebaseApp from 'firebase/app'
import 'firebase/database'
import 'firebase/storage'
import pac from 'pipe-and-compose'
import inferno from 'inferno'
import {createClassNamesFunction} from '../../lib/classnames-function'
import {css, styles} from 'css-zero/macro'

type FirebaseApp = typeof firebaseApp
const firebase = (firebaseApp as FirebaseApp & {
  default: FirebaseApp
}).default

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

firebase.initializeApp(firebaseConfig);

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
    let features = ['database', 'storage'].filter(feature => typeof app[feature] === 'function');
    document.getElementById('load')!.innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML = 'Error loading the Firebase SDK, check the console.';
  }
});
