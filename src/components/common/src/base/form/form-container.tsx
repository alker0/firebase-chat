import { DO_NOTHING } from "@components/common/util/creater-utils"
import { assignProps, Component } from "solid-js"

const defaultFormProps = {
  onSubmit: DO_NOTHING
}

type defaultConponentProps = JSX.FormHTMLAttributes<HTMLFormElement>

const nativeContainers = {
  Form: (propsArg: JSX.FormHTMLAttributes<HTMLFormElement>) => {
    const props = assignProps({}, defaultFormProps, propsArg)
    return <form {...props} />
  },
  Div: (props: JSX.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  Flagment: (props: { children?: Element }) => <>{props.children}</>
}

const defaultContext: Required<FormContainer.Context> = {
  createContainer: ({Form}) => (props) => <Form {...props} />
}

export const FormContainer = {
  createComponent<T = defaultConponentProps>(contextArg?: FormContainer.Context<T>): Component<FormContainer.Props<T>> {
    const context = assignProps({}, defaultContext, contextArg)
      const Container = context.createContainer(nativeContainers)
      return (props) => <Container {...props.containerProps} children={props.children} />
  }
}

export declare module FormContainer {
  export interface Context<T = unknown> {
    createContainer: (nativeContainer: typeof nativeContainers) => Component<T>
  }
  export interface Props<T = unknown> {
    containerProps: T
  }
}
