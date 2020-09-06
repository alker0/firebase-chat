import { Cirrus } from "@components/common/typings/cirrus-style";
import clsx, { Clsx } from "clsx";
import { Component } from "solid-js";

const cn: Clsx<Cirrus> = clsx

export const TopMenu = {
  createComponent: (context?: TopMenu.Context): Component<TopMenu.Props> => {
    return props => {
      return <div class={cn('content', 'row')}>
        <div class={cn('col-6', 'ignore-screen')}><div class={cn('btn-container')}>
          <div class={cn('btn', 'btn-xlarge')}>Nice</div>
        </div></div>
        <div class={cn('col-6', 'ignore-screen')}><div class={cn('btn-container')}>
          <div class={cn('btn', 'btn-xlarge')}>Great</div>
        </div></div>
      </div>
    }
  }
}

export declare module TopMenu {
  export interface Context { }
  export interface Props { }
}
