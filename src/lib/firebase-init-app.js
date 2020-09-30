const firebaseConfig = {
  apiKey: 'AIzaSyCUDlFQJZdo3NOIAHSt8NmgF-gOHQ9ZkHg',
  authDomain: 'talker-v1.firebaseapp.com',
  // databaseURL: 'https://talker-v1.firebaseio.com',
  databaseURL: 'http://localhost:9000',
  projectId: 'talker-v1',
  storageBucket: 'talker-v1.appspot.com',
  messagingSenderId: '578515840439',
  appId: '1:578515840439:web:2b7905e64ae01d07778c32',
  measurementId: 'G-S42EYX1LN4',
};

// Initialize Firebase

firebase.initializeApp(firebaseConfig);

console.log('Firebase is initialized');
