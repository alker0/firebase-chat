import 'solid-styled-jsx/style';
import firebase from 'firebase';
import firebaseui from 'firebaseui';
import { createComputed, assignProps } from 'solid-js';
import { ComponentCreater } from '../../types/component-creater';

const defaultProps: FirebaseAuthUI.DefaultProps = {
  uiConfig: {
    signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID],
  },
};

export const FirebaseAuthUI: ComponentCreater<
  FirebaseAuthUI.Context,
  FirebaseAuthUI.Props
> = {
  createComponent: (context) => {
    return (propsArg) => {
      const props = assignProps({}, defaultProps, propsArg);

      let authRef: HTMLDivElement | undefined;

      createComputed(() => {
        context.ui.start(authRef!, props.uiConfig);
      });

      return (
        /* eslint-disable react/jsx-one-expression-per-line */
        /* eslint-disable react/jsx-closing-tag-location */
        <div style={{ display: 'contents' }} ref={authRef}>
          {/* prettier-ignore */}
          <style jsx>{`
            div :global(label.mdl-textfield__label:not(.no-match)) {
              margin-left: unset;
              margin-top: unset;
              margin-right: unset;
              padding-top: 0.5rem;
              padding-left: 0.5rem;
            }

            div :global(.is-focused) > :global(label.mdl-textfield__label) {
              padding-top: 0;
            }
          `}</style>
        </div>
        /* eslint-enable react/jsx-one-expression-per-line */
        /* eslint-enable react/jsx-closing-tag-location */
      );
    };
  },
};

export declare module FirebaseAuthUI {
  export interface Context {
    ui: firebaseui.auth.AuthUI;
  }

  export interface Props {
    uiConfig?: firebaseui.auth.Config;
  }

  export interface DefaultProps extends Required<Props> {}
}
