import clsx, { Clsx } from 'clsx';
import { assignProps, Component, JSX } from 'solid-js';
import { Cirrus } from '@alker/cirrus-types';
import { DefaultComponents } from '../../../types/component-creator';

const cn: Clsx<Cirrus> = clsx;

const defaultWholeStyle = cn('input-control');

type DefaultPropsMap = {
  submit: JSX.InputHTMLAttributes<HTMLInputElement>;
  whole: JSX.HTMLAttributes<HTMLDivElement> & LoginBasicBottom.BottomWholeProps;
};

const defaultContext: DefaultComponents<
  LoginBasicBottom.Context,
  DefaultPropsMap
> = {
  whole: (props) => (
    <div class={defaultWholeStyle} {...props}>
      <props.submitButton />
    </div>
  ),
  submit: (props) => (
    <input type="submit" class={props.class ?? cn('animated')} {...props} />
  ),
};

const defaultProps: Required<LoginBasicBottom.Props> = {
  ofWhole: {},
  ofSubmit: { children: 'Submit' },
};

export const LoginBasicBottom = {
  createComponent<
    T = DefaultPropsMap['submit'],
    U extends LoginBasicBottom.BottomWholePropsOpts = DefaultPropsMap['whole']
  >(
    contextArg: LoginBasicBottom.Context<T, U> = {},
  ): Component<LoginBasicBottom.Props<T, U>> {
    const context = assignProps({}, defaultContext, contextArg);

    return (propsArg) => {
      const props = assignProps({}, defaultProps, propsArg);

      const SubmitButton = props.ofWhole.submitButton ?? context.submit;

      return (
        <context.whole
          {...props.ofWhole}
          submitButton={() => <SubmitButton {...props.ofSubmit} />}
        />
      );
    };
  },
};

export const { createComponent } = LoginBasicBottom;

export declare module LoginBasicBottom {
  export interface Context<
    T = unknown,
    U extends BottomWholePropsOpts = BottomWholeProps
  > {
    submit?: Component<T>;
    whole?: Component<U>;
  }

  export interface Props<
    T extends {} = {},
    U extends BottomWholePropsOpts = {}
  > {
    ofSubmit?: T;
    ofWhole?: Omit<U, 'submitButton'> & Partial<Pick<U, 'submitButton'>>;
  }

  export interface BottomWholeProps {
    submitButton: JSX.FunctionElement;
  }

  export interface BottomWholePropsOpts {
    submitButton?: JSX.FunctionElement;
  }
}
