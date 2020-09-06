import { createLazyComponent } from "@components/common/util/lazy-component-creater";

export const createLazyAuthUI = () => {
  return createLazyComponent(() => import('./../firebase-auth-own-ui'), resolved => resolved.FirebaseAuthOwnUI.createComponent({}))
}
