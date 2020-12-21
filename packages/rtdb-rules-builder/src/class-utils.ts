export function constructAssign<T, U extends Partial<T> | {}>(
  target: T,
  props: U,
): asserts target is T & U {
  Object.assign(target, props);
}
