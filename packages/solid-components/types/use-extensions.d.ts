import 'solid-styled-jsx';
import '@alker/styled-tsx';
import '@alker/type-filtered-clsx';

declare module 'solid-js' {
  export namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface StyleHTMLAttributes<T> {
      jsx: boolean;
    }
  }
}
