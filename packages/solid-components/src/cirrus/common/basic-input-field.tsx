import clsx, { Clsx } from 'clsx';
import { Cirrus } from '@alker/cirrus-types';
import { assignProps, Component } from 'solid-js';
import { sizeSuffixMap } from '../../util/cirrus-utils';
import { SizedFormItem } from '../../../types/cirrus-form';

const cn: Clsx<Cirrus> = clsx;

const defaultContext: Required<BasicInputField.Context> = {
  fieldSize: 'small',
  baseInputProps: {},
};

const defaultProps: Required<BasicInputField.Props> = {
  inputId: '',
  ofWrapper: {},
  ofLabel: {},
  ofInput: {},
  labelText: '',
};

const wrapperStyle = cn('input-control');
const labelStyle = cn('text-info');

export const BasicInputField = {
  createComponent(
    contextArg: BasicInputField.Context = {},
  ): Component<BasicInputField.Props> {
    const context = assignProps({}, defaultContext, contextArg);

    const [sizedLabel, sizedInput] = (['label', 'input'] as const).map(
      (item) => {
        if (!context.fieldSize) return item;
        return `${item}${sizeSuffixMap[context.fieldSize]}` as SizedFormItem;
      },
    );

    return (propsArg) => {
      const props = assignProps({}, defaultProps, propsArg);

      return (
        <div
          {...props.ofWrapper}
          class={clsx(wrapperStyle, props.ofWrapper.class)}
        >
          <label
            children={props.labelText}
            {...props.ofLabel}
            class={clsx(labelStyle, sizedLabel, props.ofLabel.class)}
            htmlFor={
              props.ofInput.id ?? context.baseInputProps.id ?? props.inputId
            }
          />
          <input
            {...context.baseInputProps}
            {...props.ofInput}
            class={clsx(sizedInput, props.ofInput.class)}
            id={props.ofInput.id ?? context.baseInputProps.id ?? props.inputId}
          />
        </div>
      );
    };
  },
};

export const { createComponent } = BasicInputField;

export declare module BasicInputField {
  export interface Context {
    fieldSize?: 'xsmall' | 'small' | false | 'large' | 'xlarge';
    baseInputProps?: JSX.InputHTMLAttributes<HTMLInputElement>;
  }

  export interface Props {
    inputId?: string;
    ofWrapper?: JSX.HTMLAttributes<HTMLDivElement>;
    ofLabel?: JSX.LabelHTMLAttributes<HTMLLabelElement>;
    labelText?: string;
    ofInput?: JSX.InputHTMLAttributes<HTMLInputElement>;
  }
}
