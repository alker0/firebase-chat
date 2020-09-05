import { Component, lazy } from "solid-js";

export type Resolved<P> = P extends () => Promise<infer R> ? R : never

export function createLazyComponent<R, U>(
  importer: () => Promise<R>,
  applier: (resolved: R) => Component<U>,
): Component<U> {

  let loadRunner: Promise<{default: Component<U>}> = Promise.resolve({
    default: () => <div />
  })

  let loader = async () => {
    loadRunner = importer().then(result => ({ default: applier(result) }))

    loader = async () => await loadRunner

    return await loadRunner
  }

  return lazy(() => loader())
}
