import { Component, createComputed } from 'solid-js';

export const Redirect = {
  createComponent(context: Redirect.Context): Component<Redirect.Props> {
    return (props) => {
      createComputed(() => {
        context.redirector(
          typeof props.url === 'string' ? props.url : props.url(),
        );
      });
      return props.redirectingComponent?.();
    };
  },
};

export declare module Redirect {
  export interface Context {
    redirector: (url: string) => void;
  }
  export interface Props {
    url: string | (() => string);
    redirectingComponent?: JSX.FunctionElement;
  }
}
