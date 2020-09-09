import { ComponentCreater } from '../../typings/component-creater';
import { Router } from '../base/molecules/router';

const pathInfo = () => window.location.href.replace(window.location.origin, '');

const staticMatch = (matchText: string) =>
  window.location.pathname === matchText;

export const matchUtils = {
  pathInfo,
};

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
              : info.matcher(matchUtils),
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

  export type Matcher = string | ((utils: typeof matchUtils) => boolean);

  export interface RoutingInfo {
    matcher: Matcher;
    getComponent: Router.RoutingInfo['getComponent'];
  }

  export interface Props {
    routeSignal: Router.Props['routeSignal'];
    routingTable: RoutingInfo[];
  }
}
