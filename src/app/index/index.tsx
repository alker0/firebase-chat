import {EffectMessage} from 'ferp'
import {initDropDownReducer, DropDownState} from 'lib/ferp/dropdown'

firebase.analytics()

const ferp = window.ferp

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
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.messaging().requestPermission().then(() => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });

  try {
    let app = firebase.app();
    let features = (['database', 'storage'] as const).filter(feature => typeof app[feature] === 'function');
    document.getElementById('load')!.innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    document.getElementById('load')!.innerHTML = 'Error loading the Firebase SDK, check the console.';
  }
});
