export const DO_NOTHING: (...args: any[]) => void = () => {};

export type ClickHandle<T extends HTMLElement> = JSX.EventHandler<
  T,
  MouseEvent | KeyboardEvent
>;

export const buttonize: <T extends HTMLElement>(
  clickFn: ClickHandle<T>,
  otherProps?: {
    role?: string;
    tabIndex?: number;
  },
) => Pick<
  JSX.HTMLAttributes<T>,
  'onClick' | 'onKeyDown' | 'role' | 'tabIndex'
> = (clickHandle, { role, tabIndex } = { role: 'button', tabIndex: 0 }) => ({
  onClick: clickHandle,
  onKeyDown: (event) => {
    if (event.keyCode === 13) clickHandle(event);
  },
  role: role ?? 'button',
  tabIndex: tabIndex ?? 0,
});
