import { JSX } from 'solid-js';
import { EventArgOf } from '../../types/component-utils';

export const DO_NOTHING: (...args: any[]) => void = () => {};

export type ClickHandle<T extends HTMLElement> = JSX.EventHandler<
  T,
  MouseEvent | KeyboardEvent
>;

export function buttonize<T extends HTMLElement>(
  clickHandle: ClickHandle<T>,
  {
    role = 'button',
    tabIndex = 0,
  }: {
    role?: JSX.HTMLAttributes<T>['role'];
    tabIndex?: number;
  } = {},
): Pick<JSX.HTMLAttributes<T>, 'onClick' | 'onKeyDown' | 'role' | 'tabIndex'> {
  return {
    onClick: clickHandle,
    onKeyDown: (
      event: EventArgOf<NonNullable<JSX.HTMLAttributes<T>['onKeyDown']>>,
    ) => {
      if (event.keyCode === 13) clickHandle(event);
    },
    role,
    tabIndex,
  };
}
