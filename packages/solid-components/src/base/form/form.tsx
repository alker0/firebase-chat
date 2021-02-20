import { mergeProps, Component, JSX } from 'solid-js';
import { RequiredSwitch } from '../../../types/component-utils';
import { DefaultComponents } from '../../../types/component-creator';

type DefaultPropsMap = {
  container: JSX.HTMLAttributes<HTMLElement>;
  inputFields: JSX.HTMLAttributes<HTMLDivElement>;
  bottomContents: JSX.ButtonHTMLAttributes<HTMLButtonElement>;
};

const defaultContext: DefaultComponents<Form.Context, DefaultPropsMap> = {
  container: (props) => <>{props.children}</>,
  inputFields: (props) => <div {...props} />,
  bottomContents: (props) => <button {...props} />,
};

const defaultProps: Required<Form.Props> = {
  ofContainer: {},
  ofInputFields: {},
  ofBottomContents: {},
};

export const Form = {
  createComponent<
    T extends object = DefaultPropsMap['container'],
    U extends object = DefaultPropsMap['inputFields'],
    V extends object = DefaultPropsMap['bottomContents']
  >(contextArg?: Form.Context<T, U, V>): Component<Form.Props<T, U, V>> {
    const context = mergeProps(defaultContext, contextArg);

    return (propsArg) => {
      const props = mergeProps(defaultProps, propsArg);
      return (
        <context.container {...(props.ofContainer ?? {})}>
          <context.inputFields {...(props.ofInputFields ?? {})} />
          <context.bottomContents {...(props.ofBottomContents ?? {})} />
        </context.container>
      );
    };
  },
};

export declare module Form {
  export interface Context<T = unknown, U = unknown, V = unknown> {
    container?: Component<T>;
    inputFields?: Component<U>;
    bottomContents?: Component<V>;
  }

  export type Props<
    T extends object = {},
    U extends object = {},
    V extends object = {}
  > = RequiredSwitch<T, 'ofContainer'> &
    RequiredSwitch<U, 'ofInputFields'> &
    RequiredSwitch<V, 'ofBottomContents'>;
}
