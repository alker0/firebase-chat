import { mergeProps, on, JSX } from 'solid-js';
import { Dynamic, Match, Suspense, Switch } from 'solid-js/web';
import { ComponentCreater } from '../../../types/component-creator';

const defaultContext: Router.DefaultContext = {
  loadingElement: () => <div>Loading...</div>,
  unmatchElement: () => <div>not found</div>,
};

export const Router: ComponentCreater<Router.Context, Router.Props> = {
  createComponent: (contextArg) => {
    const context = mergeProps(defaultContext, contextArg);

    return (props) => {
      const routeComponent = () => (
        <Switch fallback={context.unmatchElement()}>
          {props.routingTable.map((info) => (
            <Match when={info.matchFn()}>{info.getComponent()}</Match>
          ))}
        </Switch>
      );

      const getRouteComponent = on(props.routeSignal, () => {
        return routeComponent;
      });

      return (
        <Suspense fallback={context.loadingElement()}>
          <Dynamic component={getRouteComponent()} />
        </Suspense>
      );
    };
  },
};

export declare module Router {
  export interface Context {
    loadingElement?: JSX.FunctionElement;
    unmatchElement?: JSX.FunctionElement;
  }

  export interface DefaultContext extends Required<Context> {}

  export interface RoutingInfo {
    matchFn: () => boolean;
    getComponent: JSX.FunctionElement;
  }

  export interface Props {
    routeSignal: () => unknown;
    routingTable: RoutingInfo[];
  }
}
