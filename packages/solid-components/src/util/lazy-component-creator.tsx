import { Component, lazy } from 'solid-js';

export type Resolved<P> = P extends () => Promise<infer R> ? R : never;

export function createLazyComponent<R, U>(
  importer: () => Promise<R>,
  applier: (resolved: R) => Component<U>,
): Component<U> {
  let loadRunner: Promise<{ default: Component<U> }> = Promise.resolve({
    default: () => <div />,
  });

  let loader = () => {
    loadRunner = importer().then((result) => ({ default: applier(result) }));

    loader = () => loadRunner;

    return loadRunner;
  };

  return lazy(() => loader());
}
