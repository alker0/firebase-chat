import { createRoot } from "solid-js";

export const createDisposableStyle = (cssResolve: () => {className: string, styles: string}) =>
  createRoot(dispose => ({
    className: cssResolve().className,
    dispose
}))
