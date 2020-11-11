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
    onKeyDown: (event) => {
      if (event.keyCode === 13) clickHandle(event);
    },
    role,
    tabIndex,
  };
}
