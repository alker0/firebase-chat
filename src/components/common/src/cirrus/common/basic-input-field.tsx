import { SizedFormItem } from '@components/common/typings/cirrus-form';
import { Cirrus } from '@components/common/typings/cirrus-style';
import clsx, { Clsx } from 'clsx';
import { assignProps, Component } from 'solid-js';
import { sizeSuffixMap } from '../../util/cirrus-utils';

const cn: Clsx<Cirrus> = clsx;

const defaultContext: Required<BasicInputField.Context> = {
  fieldSize: 'small',
  baseInputProps: {},
};

const defaultProps: Required<BasicInputField.Props> = {
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
          <div
            children={props.labelText}
            {...props.ofLabel}
            class={clsx(labelStyle, sizedLabel, props.ofLabel.class)}
          />
          <input
            {...context.baseInputProps}
            {...props.ofInput}
            class={clsx(sizedInput, props.ofInput.class)}
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
    ofWrapper?: JSX.HTMLAttributes<HTMLDivElement>;
    ofLabel?: JSX.HTMLAttributes<HTMLDivElement>;
    labelText?: string;
    ofInput?: JSX.InputHTMLAttributes<HTMLInputElement>;
  }
}
