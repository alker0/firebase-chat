declare global {
  import 'solid-js/types/rendering/jsx';
  interface StyleHTMLAttributes<T> extends JSX.HTMLAttributes<T> {
    jsx?: boolean,
    global?: boolean
  }
}

declare module 'styled-jsx/css' {
  type CSS = {
    (chunks: TemplateStringsArray, ...args: any[]): string
    global: (chunks: TemplateStringsArray, ...args: any[]) => string
    resolve: (chunks: TemplateStringsArray, ...args: any[]) => { className: string; styles: string }
  }

  export const css: CSS;
}
