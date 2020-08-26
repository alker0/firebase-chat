import { Component, lazy } from "solid-js";
import { ComponentCreater } from "../../typings/component-creater";

export type Resolved<P> = P extends () => Promise<infer R> ? R : never

type CreaterFilter<P> = Resolved<P> extends Record<infer K, ComponentCreater<infer S, infer T, infer U>> ? {
  importer: () => Promise<Resolved<P>>
  context: S,
  result: Component<T> & U
} : never

export function createLazyComponent<P extends () => Promise<{}>, R extends Resolved<P>, M extends CreaterFilter<P>>(
  importer: M["importer"],
  createrKey: keyof R,
  context: M["context"]
): M["result"] {

  let loadRunner: Promise<{default: Component}> = Promise.resolve({
    default: () => <div />
  })

  let loader = async () => {
    loadRunner = importer().then(result => ({ default: result[createrKey].createComponent(context) }))

    loader = async () => await loadRunner

    return await loadRunner
  }

  return lazy(() => loader())
}
