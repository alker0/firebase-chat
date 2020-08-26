import { FirebaseAuthUI } from "@components/cirrus/domain/firebase-auth-ui";
import { createLazyComponent } from "@components/cirrus/util/lazy-component-creater";

export const createLazyFirebaseAuthUI = (context: FirebaseAuthUI.Context) => {
  return createLazyComponent(() => import('@components/cirrus/domain/firebase-auth-ui'), 'FirebaseAuthUI', context)
}
