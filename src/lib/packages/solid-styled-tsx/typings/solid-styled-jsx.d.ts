import 'solid-js/types/rendering/jsx';

declare global {
  interface StyleHTMLAttributes<T> extends JSX.HTMLAttributes<T> {
    jsx?: boolean,
    global?: boolean,
  }
}
