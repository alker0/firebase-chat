export interface ComponentCreater<T> {
  createComponent: (context?: T) => JSX.FunctionalElement
}
