import { ComponentCreater } from "../../typings/component-creater";
import { Router } from "../base/molecules/router";

const matchPath = (target: string) => location.pathname.startsWith(target)

export const PathMatchRouter: ComponentCreater<PathMatchRouter.Context, PathMatchRouter.Props> = {
  createComponent: context => {
  const RouteComponent = Router.createComponent(context)
    return props => <RouteComponent routingTable={props.routingTable.map(info => ({
      matchFn: () => matchPath(info.matchPath),
      getComponent: info.getComponent
    }))}></RouteComponent>
  }
}

export declare module PathMatchRouter {
  export interface Context extends Router.Context {}

  export interface DefaultContext extends Router.DefaultContext {}

  export interface RoutingInfo {
    matchPath: string,
    getComponent: Router.RoutingInfo["getComponent"]
  }

  export interface Props {
    routingTable: RoutingInfo[]
  }
}


