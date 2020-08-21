export type FilteredClassValue<T extends string>
  = FilteredClassArray<T>
  | Record<T, any>
  | T
  | number
  | null
  | boolean
  | undefined

export interface FilteredClassArray<T extends string> extends Array<FilteredClassValue<T>> {}

export type FilteredClassFunction<T extends stirng> = (...classes: FilteredClassValue<T>[]) => string

export type FilteredClassFunctionCreater = <T extends string>() => FilteredClassFunction<T>

export const createFilteredClassFunction: FilteredClassFunctionCreater
