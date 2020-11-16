import { EventArgOf } from '@components/common/typings/component-utils';

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

export function memoHandler<
  T extends () => JSX.EventHandlerUnion<unknown, Event>
>(handleFn: T) {
  const handlerName = handleFn.name;
  return {
    [handlerName]: (e: EventArgOf<T>) => {
      const handler = handleFn();
      return typeof handler === 'function'
        ? handler(e)
        : handler[0](handler[1], e);
    },
  }[handlerName];
}
