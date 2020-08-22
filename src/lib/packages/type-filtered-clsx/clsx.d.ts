declare module 'clsx' {
  export type FilteredClassValue<T extends string>
      = FilteredClassArray<T>
      | Record<T, any>
      | T
      | number
      | null
      | boolean
      | undefined

  export interface FilteredClassArray<T extends string> extends Array<FilteredClassValue<T>> { }

  export type FilteredClassFunction<T extends string> = (...classes: FilteredClassValue<T>[]) => string

  export type Clsx<T extends string = string> = FilteredClassFunction<T>

  export default clsx as <T extends string = string>(...classes: FilteredClassValue<T>[]) => string
}
