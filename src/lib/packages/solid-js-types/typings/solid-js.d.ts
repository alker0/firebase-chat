import 'solid-js'

declare module 'solid-js' {
  export function setDefaults<T, U extends T>(props: T, defaultProps: U): asserts props is T & U
}

import 'solid-js/types/rendering/jsx'

declare global {
  namespace JSX {
    interface HTMLAttributes<T> extends DOMAttributes<T> {
      role?: string
    }
  }
}

