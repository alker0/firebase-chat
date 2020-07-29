export function staticOf(funcElement: JSX.FunctionalElement) {
  funcElement.defaultHooks = {
    ...funcElement.defaultHooks,
    onComponentShouldUpdate(_1: unknown, _2: unknown) {
      return false
    }
  }
  return funcElement
}
