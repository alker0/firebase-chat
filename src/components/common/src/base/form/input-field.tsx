import { DefaultComponents } from "../../../typings/component-creater";
import { assignProps, Component } from "solid-js";

type DefaultPropsMap = {
  wrapper: JSX.HTMLAttributes<HTMLDivElement>,
  contents: JSX.HTMLAttributes<HTMLDivElement>;
};

const defaultContext: DefaultComponents<InputField.Context, DefaultPropsMap> = {
  wrapper: props => <div {...props} />,
  contents: props => <div {...props} />
};

const defaultProps: Required<Pick<InputField.Props, 'ofWrapper' | 'ofContents'>> = {
  ofWrapper: {},
  ofContents: {},
};

export const InputField = {
  createComponent<
    T = DefaultPropsMap["wrapper"],
    U = DefaultPropsMap["contents"]
  >(contextArg: InputField.Context<T, U> = {}): Component<InputField.Props<T, U>> {
    const context = assignProps({}, defaultContext, contextArg);
    return propsArg => {
      const props = assignProps({}, defaultProps, propsArg);
      const Wrapper = props.wrapper ?? context.wrapper;
      const Contents = props.contents ?? context.contents;
      return <Wrapper {...props.ofWrapper}>
        <Contents {...props.ofContents} />
      </Wrapper>;
    };
  }
};

export declare module InputField {
  export interface Context<T = unknown, U = unknown> {
    wrapper?: Component<T>,
    contents?: Component<U>;
  }

  export interface Props<T = {}, U = {}> {
    wrapper?: Component<T>,
    contents?: Component<U>,
    ofWrapper?: T,
    ofContents?: U;
  }
}
