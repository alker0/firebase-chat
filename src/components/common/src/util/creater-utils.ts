export const DO_NOTHING: (...args: any[]) => void = () => {};

export type ClickHandle<T extends HTMLElement> = JSX.EventHandler<
  T,
  MouseEvent | KeyboardEvent
>;

export const buttonize: <T extends HTMLElement>(
  clickFn: ClickHandle<T>,
) => Pick<
  JSX.HTMLAttributes<T>,
  'onClick' | 'onKeyDown' | 'role' | 'tabIndex'
> = (clickHandle) => ({
  onClick: clickHandle,
  onKeyDown: (event) => {
    if (event.keyCode === 13) clickHandle(event);
  },
  role: 'button',
  tabIndex: -1,
});
