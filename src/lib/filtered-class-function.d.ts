export type FilteredClassValue<T extends string>
  = FilteredClassArray
  | FilteredClassDictionary
  | T
  | number
  | null
  | boolean
  | undefined

export interface FilteredClassArray<T extends string> extends Array<FilteredClassValue<T>> {}

export interface FilteredClassDictionary<T extends string> {
	[id: T]: any;
}

export interface FilteredClassFunction<T extends string> {
    (...classes: FilteredClassValue<T>[]): string;
}

export type FilteredClassFunctionCreater = <T extends string>() => FilteredClassFunction<T>

export const createFilteredClassFunction: FilteredClassFunctionCreater
