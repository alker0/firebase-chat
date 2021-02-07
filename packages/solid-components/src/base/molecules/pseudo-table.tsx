import { createMemo, assignProps, JSX } from 'solid-js';
import { For } from 'solid-js/web';

export const defaultPseudoTableProps: PseudoTable.FixedProps = {
  fallbackElement: null,
  columnCounts: 4,
  rowWrapperProps: {},
  componentArray: [],
};

interface ComponentInfoTableElement {
  component: PseudoTable.IndexedComponent;
  applied: JSX.Element;
}

type ComponentInfoRow = ComponentInfoTableElement[];
type ComponentInfoTable = ComponentInfoRow[];

interface ComponentForTable extends PseudoTable.IndexedComponent {}

function createTableInfo(
  component: ComponentForTable,
  index: number,
  rowNumber: number,
  columnNumber: number,
): ComponentInfoTableElement {
  return {
    component,
    applied: component(index, rowNumber, columnNumber),
  };
}

function componentToTableInfoElement(
  accumRow: Partial<ComponentInfoRow> | undefined,
  targetRowNumber: number,
  targetRowStartIndex: number,
) {
  if (accumRow) {
    return (currentComponent: ComponentForTable, columnNumber: number) => {
      const accumRowElm = accumRow[columnNumber];
      if (accumRowElm && currentComponent === accumRowElm.component) {
        return accumRowElm;
      } else {
        return createTableInfo(
          currentComponent,
          targetRowStartIndex + columnNumber,
          targetRowNumber,
          columnNumber,
        );
      }
    };
  } else {
    return (currentComponent: ComponentForTable, columnNumber: number) =>
      createTableInfo(
        currentComponent,
        targetRowStartIndex + columnNumber,
        targetRowNumber,
        columnNumber,
      );
  }
}

function createChunksMemoRunner(props: PseudoTable.FixedProps) {
  return (accumTable: ComponentInfoTable) => {
    const { componentArray, columnCounts } = props;

    let targetRowNumber = 0;
    let targetRow = componentArray.slice(0, columnCounts);
    let targetRowStartIndex = 0;
    let resultTable: ComponentInfoTable = [];

    while (targetRow.length) {
      const accumRow = accumTable[targetRowNumber];
      resultTable = resultTable.concat([
        targetRow.map(
          componentToTableInfoElement(
            accumRow,
            targetRowNumber,
            targetRowStartIndex,
          ),
        ),
      ]);

      // update for next
      targetRowNumber += 1;
      targetRowStartIndex += columnCounts;
      targetRow = componentArray.slice(
        targetRowStartIndex,
        targetRowStartIndex + columnCounts,
      );
    }

    return resultTable;
  };
}

export const PseudoTable = {
  createComponent: (context: PseudoTable.Context) => {
    return (propsArg: PseudoTable.Props) => {
      const props = assignProps({}, defaultPseudoTableProps, context, propsArg);
      const chunksMemoRunner = createChunksMemoRunner(props);
      const chunks = createMemo(chunksMemoRunner, [], false);
      return (
        <For each={chunks()} fallback={props.fallbackElement}>
          {(chunk) => (
            <div {...props.rowWrapperProps}>
              <For each={chunk}>{(elmInfo) => elmInfo.applied}</For>
            </div>
          )}
        </For>
      );
    };
  },
};

export declare module PseudoTable {
  export interface IndexedComponent {
    (index: number, rowNunber: number, columnNumber: number): JSX.Element;
  }
  export type IndexedComponentArray = IndexedComponent[];

  export interface Context {
    fallbackElement?: JSX.Element;
    columnCounts?: number;
    rowWrapperProps?: JSX.HTMLAttributes<HTMLDivElement>;
    componentArray?: IndexedComponentArray;
  }
  export interface Props extends Context {}
  export interface FixedProps extends Required<Props> {}
}
