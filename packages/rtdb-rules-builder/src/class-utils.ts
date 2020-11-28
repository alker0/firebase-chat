export function constructAssign<T, U extends Partial<T> | {}>(
  target: T,
  props: U,
) {
  return Object.assign(target, props);
}
