export const DO_NOTHING = () => {};

export function getLastElement<T>(array: T[]) {
  return array.slice(-1)[0];
}
