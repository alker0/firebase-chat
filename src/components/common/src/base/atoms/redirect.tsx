import { afterEffects, Component } from "solid-js"

export const Redirector = {
  createComponent(context: Redirector.Context): Component<Redirector.Props> {
    return props => {
      afterEffects(() => {
        context.redirector(typeof props.url === 'string' ? props.url : props.url())
      })
      return props.redirectingComponent?.()
    }
  }
}

export declare module Redirector {
  export interface Context {
    redirector: (url: string) => void
  }
  export interface Props {
    url: string | (() => string),
    redirectingComponent?: JSX.FunctionElement
  }
}
