import { Component, lazy } from "solid-js";
import { ComponentCreater } from "../../typings/component-creater";

export type Resolved<P> = P extends () => Promise<infer R> ? R : never

type CreaterFilter<P> = P extends Record<keyof P, ComponentCreater<infer S, infer T, infer U>> ? {
  importer: () => Promise<P>,
  context: S,
  result: Component<T> & U
} : never

export function createLazyComponent<P, M extends CreaterFilter<P>>(
  importer: M["importer"],
  createrKey: keyof P,
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
