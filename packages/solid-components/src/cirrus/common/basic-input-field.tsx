import clsx, { Clsx } from 'clsx';
import { Cirrus } from '@alker/cirrus-types';
import { assignProps, Component, JSX } from 'solid-js';
import { sizeSuffixMap } from '../../util/cirrus-utils';

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

function getSizedFieldClassName(
  fieldSize: BasicInputField.Context['fieldSize'],
) {
  if (fieldSize) {
    return [
      `label${sizeSuffixMap[fieldSize]}`,
      `input${sizeSuffixMap[fieldSize]}`,
    ] as const;
  } else {
    return ['label', false] as const;
  }
}

export const BasicInputField = {
  createComponent(
    contextArg: BasicInputField.Context = {},
  ): Component<BasicInputField.Props> {
    const context = assignProps({}, defaultContext, contextArg);

    const [sizedLabel, sizedInput] = getSizedFieldClassName(context.fieldSize);

    return (propsArg) => {
      const props = assignProps({}, defaultProps, propsArg);

      return (
        <div
          {...props.ofWrapper}
          class={`${cn('input-control')} ${props.ofWrapper.class}`}
        >
          <label
            children={props.labelText}
            {...props.ofLabel}
            class={`${cn('text-info', sizedLabel)} ${props.ofLabel.class}`}
            htmlFor={
              props.ofInput.id ?? context.baseInputProps.id ?? props.inputId
            }
          />
          <input
            {...context.baseInputProps}
            {...props.ofInput}
            class={`${cn(sizedInput)} ${props.ofInput.class}`}
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
