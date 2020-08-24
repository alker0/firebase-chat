import { ComponentCreater, LazyComponent } from "../../typings/component-creater";

export function createLazyComponent<
    K extends string,
    S,
    T = unknown,
    U = unknown
  >(
    importer: () => Promise<Record<K, ComponentCreater<S, T, U>>>,
    path: K,
    context: S
  ): LazyComponent<T> {

  return async () => {
    const component = await importer()
      .then(result => result[path].createComponent(context))
      .catch(err => {
        console.error(err)
        return () => <div />
      })

    return { default: component }
  }
}
