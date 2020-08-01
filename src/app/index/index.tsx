import { Ferp } from '/lib/deps'
import { initDropDownReducer, DropDownState } from '/lib/ferp/dropdown'
import { staticOf } from '../../lib/inferno-utils'

firebase.analytics()

const {dropDownInit, dropDownSub} = initDropDownReducer({
  key: Symbol('dropdown'),
  menuItems:[
    staticOf(() => <a href="#">First Item</a>),
    staticOf(() => <a href="#">Second Item</a>),
    staticOf(() => <a href="#">Third Item</a>),
    staticOf(() => <a href="#">Fourth Item</a>),
  ]
})

type AnyEffectFunction<T, U extends unknown=unknown> = (param: U) => [T, Ferp.EffectMessage]

type UpdateFunction = AnyEffectFunction<DropDownState>

Ferp.app({
  init: [dropDownInit, Ferp.effects.none()],
  update: (message: UpdateFunction, state) => {
    return message(state)
  },
  subscribe: state => [
    dropDownSub('#dropdown-click')
  ]
})

document.addEventListener('DOMContentLoaded', function() {
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.messaging().requestPermission().then(() => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
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

