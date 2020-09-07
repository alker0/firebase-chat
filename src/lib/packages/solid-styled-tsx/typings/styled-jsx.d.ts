declare module 'styled-jsx/css' {
  type CSS = {
    (chunks: TemplateStringsArray, ...args: any[]): string;
    global: (chunks: TemplateStringsArray, ...args: any[]) => string;
    resolve: (chunks: TemplateStringsArray, ...args: any[]) => { className: string; styles: string; };
  };

  export const css: CSS;
}
