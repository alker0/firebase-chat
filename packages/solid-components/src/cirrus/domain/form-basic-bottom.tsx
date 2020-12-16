import clsx, { Clsx } from 'clsx';
import { assignProps, Component, JSX } from 'solid-js';
import { Cirrus } from '@alker/cirrus-types';
import { DefaultComponents } from '../../../types/component-creator';

const cn: Clsx<Cirrus> = clsx;

const defaultWholeStyle = cn('input-control');

type DefaultPropsMap = {
  submit: JSX.InputHTMLAttributes<HTMLInputElement>;
  whole: JSX.HTMLAttributes<HTMLDivElement> & FormBasicBottom.BottomWholeProps;
};

const defaultContext: DefaultComponents<
  FormBasicBottom.Context,
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

const defaultProps: Required<FormBasicBottom.Props> = {
  ofWhole: {},
  ofSubmit: { children: 'Submit' },
};

export const FormBasicBottom = {
  createComponent<
    T = DefaultPropsMap['submit'],
    U extends FormBasicBottom.BottomWholePropsOpts = DefaultPropsMap['whole']
  >(
    contextArg: FormBasicBottom.Context<T, U> = {},
  ): Component<FormBasicBottom.Props<T, U>> {
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

export const { createComponent } = FormBasicBottom;

export declare module FormBasicBottom {
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
