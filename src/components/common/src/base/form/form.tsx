import { DefaultComponents } from "../../../typings/component-creater";
import { assignProps, Component } from "solid-js";

type DefaultPropsMap = {
  container: JSX.HTMLAttributes<HTMLElement>,
  inputFields: JSX.HTMLAttributes<HTMLDivElement>,
  bottomContents: JSX.ButtonHTMLAttributes<HTMLButtonElement>
}

const defaultContext: DefaultComponents<Form.Context, DefaultPropsMap> = {
  container: props => <>{props.children}</>,
  inputFields: props => <div {...props} />,
  bottomContents: props => <button {...props} />
}

const defaultProps: Required<Form.Props> = {
  ofContainer: {},
  ofInputFields: {},
  ofBottomContents: {}
}

export const Form = {
  createComponent<
    T = DefaultPropsMap["container"],
    U = DefaultPropsMap["inputFields"],
    V = DefaultPropsMap["bottomContents"]
  >(contextArg?: Form.Context<T, U, V>): Component<Form.Props<T, U, V>> {
    const context = assignProps({}, defaultContext, contextArg)// as Required<typeof contextArg>

    return propsArg => {
      const props = assignProps({}, defaultProps, propsArg)
      return <context.container {...(props.ofContainer ?? {})}>
      <context.inputFields {...(props.ofInputFields ?? {})} />
      <context.bottomContents {...(props.ofBottomContents ?? {})} />
    </context.container>
    }
  }
}

export declare module Form {
  export interface Context<T = unknown, U = unknown, V = unknown> {
    container?: Component<T>,
    inputFields?: Component<U>,
    bottomContents?: Component<V>
  }

  export interface Props<T = unknown, U = unknown, V = unknown> {
    ofContainer?: T,
    ofInputFields?: U,
    ofBottomContents?: V
  }
}
