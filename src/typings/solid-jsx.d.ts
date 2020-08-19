import 'solid-js/types/rendering/jsx'

declare global {
  namespace JSX {
    interface HTMLAttributes<T> extends DOMAttributes<T> {
      role?: stirng
    }
  }
}
