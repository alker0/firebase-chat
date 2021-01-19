import clsx, { Clsx } from 'clsx';
import { Cirrus } from '@alker/cirrus-types';
import { assignProps, Component, createMemo, JSX } from 'solid-js';
import { sizeSuffixMap } from '../../util/cirrus-utils';

const cn: Clsx<Cirrus> = clsx;

const defaultContext: Required<BasicInputField.Context> = {
  fieldSize: 'small',
  baseInputProps: {},
  layoutFn: (Label, Input) => (
    <>
      <Label />
      <Input />
    </>
  ),
};

const defaultProps: Required<Omit<BasicInputField.Props, 'layoutFn'>> = {
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

      const fieldId = createMemo(() => {
        return props.ofInput.id ?? context.baseInputProps.id ?? props.inputId;
      });

      return (
        <div
          {...props.ofWrapper}
          class={cn('input-control', props.ofWrapper.class as Cirrus)}
        >
          {(props.layoutFn ?? context.layoutFn)(
            () => (
              <label
                children={props.labelText}
                {...props.ofLabel}
                class={cn(
                  'text-info',
                  sizedLabel,
                  props.ofLabel.class as Cirrus,
                )}
                htmlFor={fieldId()}
              />
            ),
            () => (
              <input
                {...context.baseInputProps}
                {...props.ofInput}
                class={cn(sizedInput, props.ofInput.class as Cirrus)}
                id={fieldId()}
              />
            ),
          )}
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
    layoutFn?: LayoutFunction;
  }

  export interface Props {
    inputId?: string;
    ofWrapper?: JSX.HTMLAttributes<HTMLDivElement>;
    ofLabel?: JSX.LabelHTMLAttributes<HTMLLabelElement>;
    labelText?: string;
    ofInput?: JSX.InputHTMLAttributes<HTMLInputElement>;
    layoutFn?: LayoutFunction;
  }

  export interface LayoutFunction {
    (
      labelElement: JSX.FunctionElement,
      inputElement: JSX.FunctionElement,
    ): JSX.Element;
  }
}
