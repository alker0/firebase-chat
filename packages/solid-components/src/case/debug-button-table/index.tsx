import { createMemo, mergeProps, splitProps, JSX } from 'solid-js';
import { FixedDebugButtonProps } from './utils';
import { PseudoTable } from '../../base/molecules/pseudo-table';

type PropsKeyForSelf = 'getDebugButtonPropsArray' | 'columnWrapperProps';

const propsKeyForSelf: (keyof Pick<
  DebugButtonTable.FixedProps,
  PropsKeyForSelf
>)[] = ['getDebugButtonPropsArray', 'columnWrapperProps'];

export const defaultDebugButtonTableProps: Pick<
  DebugButtonTable.FixedProps,
  PropsKeyForSelf | 'fallbackElement'
> = {
  fallbackElement: 'No Debug Buttons',
  columnWrapperProps: {},
  getDebugButtonPropsArray: () => [],
};

export const DebugButtonTable = {
  createComponent: (context: DebugButtonTable.Context) => {
    const [contextOnlyForSelf, contextDelegatable] = splitProps(
      context,
      propsKeyForSelf,
    );
    const TableComponent = PseudoTable.createComponent(contextDelegatable);
    return (propsArg: DebugButtonTable.Props) => {
      const props = mergeProps(
        defaultDebugButtonTableProps,
        contextOnlyForSelf,
        propsArg,
      );
      const [onlyForSelf, delegatable] = splitProps(props, propsKeyForSelf);
      const componentArrayMemo = createMemo(() => {
        return onlyForSelf.getDebugButtonPropsArray().map((buttonProps) => {
          return () => {
            return (
              <div {...onlyForSelf.columnWrapperProps}>
                <button
                  {...buttonProps.otherProps}
                  onClick={buttonProps.onClick}
                >
                  {buttonProps.innerContents}
                </button>
              </div>
            );
          };
        });
      });
      return (
        <TableComponent
          {...delegatable}
          componentArray={componentArrayMemo()}
        />
      );
    };
  },
};

export declare module DebugButtonTable {
  export interface Context extends Omit<PseudoTable.Context, 'componentArray'> {
    columnWrapperProps?: JSX.HTMLAttributes<HTMLDivElement>;
    getDebugButtonPropsArray?: () => FixedDebugButtonProps[];
  }
  export interface Props extends Context {}
  export interface FixedProps extends Required<Props> {}
}
