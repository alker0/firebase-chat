import clsx, { Clsx } from 'clsx';
import { assignProps, Component } from 'solid-js';
import { Cirrus } from '@components/common/typings/cirrus-style';
import { DefaultComponents } from '../../../typings/component-creater';

const cn: Clsx<Cirrus> = clsx;

const defaultWrapperStyle = cn('input-control');

type DefaultPropsMap = {
  wrapper: JSX.HTMLAttributes<HTMLDivElement>;
  switchLink: JSX.AnchorHTMLAttributes<HTMLAnchorElement>;
  submit: JSX.InputHTMLAttributes<HTMLInputElement>;
};

const defaultContext: DefaultComponents<
  LoginBasicBottom.Context,
  DefaultPropsMap
> = {
  wrapper: (props) => (
    <div {...props} class={clsx(defaultWrapperStyle, props.class)} />
  ),
  switchLink: (props) => <a {...props} />,
  submit: (props) => <input type="submit" {...props} />,
};

const defaultProps: Required<LoginBasicBottom.Props> = {
  ofWrapper: {},
  ofLink: {},
  ofSubmit: { children: 'Submit' },
};

export const LoginBasicBottom = {
  createComponent<
    T = DefaultPropsMap['wrapper'],
    U = DefaultPropsMap['switchLink'],
    V = DefaultPropsMap['submit']
  >(
    contextArg: LoginBasicBottom.Context<T, U, V> = {},
  ): Component<LoginBasicBottom.Props<T, U, V>> {
    const context = assignProps({}, defaultContext, contextArg);

    return (propsArg) => {
      const props = assignProps({}, defaultProps, propsArg);

      return (
        <context.wrapper {...props.ofWrapper}>
          <context.switchLink {...props.ofLink} />
          <context.submit {...props.ofSubmit} />
        </context.wrapper>
      );
    };
  },
};

export const { createComponent } = LoginBasicBottom;

export declare module LoginBasicBottom {
  export interface Context<T = unknown, U = unknown, V = unknown> {
    wrapper?: Component<T>;
    switchLink?: Component<U>;
    submit?: Component<V>;
  }

  export interface Props<T = unknown, U = unknown, V = unknown> {
    ofWrapper?: T;
    ofLink?: U;
    ofSubmit?: V;
  }
}
