import firebaseSdk from 'firebase/app';

declare global {
  const firebase: typeof firebaseSdk;
}
