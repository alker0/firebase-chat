import { ComponentCreater } from '../../typings/component-creater';
import { Router } from '../base/molecules/router';

const staticMatch = (matchText: string) =>
  window.location.pathname === matchText;

export const PathMatchRouter: ComponentCreater<
  PathMatchRouter.Context,
  PathMatchRouter.Props
> = {
  createComponent: (context) => {
    const RouteComponent = Router.createComponent(context);
    return (props) => (
      <RouteComponent
        routingTable={props.routingTable.map((info) => ({
          matchFn: () =>
            typeof info.matcher === 'string'
              ? staticMatch(info.matcher)
              : info.matcher(),
          getComponent: info.getComponent,
        }))}
        routeSignal={props.routeSignal}
      />
    );
  },
};

export declare module PathMatchRouter {
  export interface Context extends Router.Context {}

  export interface DefaultContext extends Router.DefaultContext {}

  export type Matcher = string | (() => boolean);

  export interface RoutingInfo {
    matcher: Matcher;
    getComponent: Router.RoutingInfo['getComponent'];
  }

  export interface Props {
    routeSignal: Router.Props['routeSignal'];
    routingTable: RoutingInfo[];
  }
}
