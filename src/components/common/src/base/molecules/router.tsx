import { assignProps, createMemo, Dynamic, Suspense } from "solid-js";
import { ComponentCreater } from "../../../typings/component-creater";

const defaultContext: Router.DefaultContext = {
  loadingElement: () => <div>Loading...</div>,
  unmatchElement: () => <div>not found</div>
}

export const Router: ComponentCreater<Router.Context, Router.Props> = {
  createComponent: contextArg => {
    const context = assignProps({}, defaultContext, contextArg)

    return props => {
      const routeResult = createMemo(() => {
        props.routeSignal()
        return props.routingTable.find(info => info.matchFn())?.getComponent ?? context.unmatchElement
      })
      return <Suspense fallback={context.loadingElement()}>
        <Dynamic component={routeResult()} />
      </Suspense>
    }
  }
}

export declare module Router {
  export interface Context {
    loadingElement?: JSX.FunctionElement,
    unmatchElement?: JSX.FunctionElement
  }

  export interface DefaultContext extends Required<Context> {}

  export interface RoutingInfo {
      matchFn: () => boolean,
      getComponent: JSX.FunctionElement
  }

  export interface Props {
    routeSignal: () => any,
    routingTable: RoutingInfo[]
  }
}

