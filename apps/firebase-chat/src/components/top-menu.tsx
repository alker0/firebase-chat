import {
  buttonize,
  ClickHandle,
  DO_NOTHING,
} from '@components/common/util/component-utils';
import { Cirrus } from '@components/common/typings/cirrus-style';
import clsx, { Clsx } from 'clsx';
import { assignProps, Component } from 'solid-js';

const cn: Clsx<Cirrus> = clsx;

type OnDivClick = ClickHandle<HTMLDivElement>;
type OnButtonClick = JSX.ButtonHTMLAttributes<HTMLButtonElement>['onClick'];

const defaultContext: Required<TopMenu.Context> = {
  headerContents: () => undefined,
  getSessionButtonText: () => 'Log In',
  onSessionButtonClick: DO_NOTHING,
  leftButtonText: 'Left Button',
  onLeftButtonClick: DO_NOTHING,
  rightButtonText: 'Right Button',
  onRightButtonClick: DO_NOTHING,
};

export const TopMenu = {
  createComponent: (contextArg?: TopMenu.Context): Component<TopMenu.Props> => {
    const context = assignProps({}, defaultContext, contextArg);
    return () => {
      return (
        <div class={cn('content')}>
          <div class={cn('row')}>{context.headerContents()}</div>
          <div class={cn('row')}>
            <button
              class={cn('btn-xlarge', 'offset-center')}
              onClick={context.onSessionButtonClick}
            >
              {context.getSessionButtonText()}
            </button>
          </div>
          <div class={cn('row')}>
            <div class={cn('col-6', 'ignore-screen')}>
              <div
                class={cn('btn', 'btn-xlarge', 'btn-animated')}
                {...buttonize(context.onLeftButtonClick)}
              >
                {context.leftButtonText}
              </div>
            </div>
            <div class={cn('col-6', 'ignore-screen')}>
              <div
                class={cn('btn', 'btn-xlarge', 'btn-animated')}
                {...buttonize(context.onRightButtonClick)}
              >
                {context.rightButtonText}
              </div>
            </div>
          </div>
        </div>
      );
    };
  },
};

export declare module TopMenu {
  export interface Context {
    headerContents?: JSX.FunctionElement;
    getSessionButtonText?: () => string;
    onSessionButtonClick?: OnButtonClick;
    leftButtonText?: string;
    onLeftButtonClick?: OnDivClick;
    rightButtonText?: string;
    onRightButtonClick?: OnDivClick;
  }
  export interface Props {}
}
