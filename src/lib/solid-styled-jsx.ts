import { createSignal, createRoot } from "solid-js"

type CSSResult = string | { className: string, styles: string }

const wrapCss = <T extends CSSResult>(styleFunc: () => T): T => {
  const [result, setResult] = createSignal<T>()
  createRoot(() => setResult(styleFunc()))
  return result()
}

export { wrapCss }
