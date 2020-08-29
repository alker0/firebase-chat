import { assignProps, For, Match, Suspense, Switch } from "solid-js";
import { ComponentCreater } from "../../../typings/component-creater";

const defaultContext: Router.DefaultContext = {
  loadingElement: () => <div>Loading...</div>,
  unmatchElement: () => <div>not found</div>
}

export const Router: ComponentCreater<Router.Context, Router.Props> = {
  createComponent: contextArg => {
    const context = assignProps({}, defaultContext, contextArg)

    return props => {
      return <Suspense fallback={context.loadingElement()}>
        <Switch fallback={context.unmatchElement()}>
          <For each={props.routingTable}>
            {info => <Match when={info.matchFn()}>
              {info.getComponent()}
            </Match>
            }
          </For>
        </Switch>
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
    routingTable: RoutingInfo[]
  }
}

