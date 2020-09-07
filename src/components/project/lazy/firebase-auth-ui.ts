import { FirebaseAuthUI } from "@components/common/domain/firebase-auth-ui";
import { createLazyComponent } from "@components/common/util/lazy-component-creater";

export const createLazyFirebaseAuthUI = (context: FirebaseAuthUI.Context) => {
  return createLazyComponent(() => import('@components/common/domain/firebase-auth-ui'), resolved => resolved.FirebaseAuthUI.createComponent(context));
};
