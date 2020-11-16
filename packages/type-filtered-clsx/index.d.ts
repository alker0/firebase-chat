declare module 'clsx' {
  export type FilteredClassValue<T extends string | symbol> =
    | FilteredClassArray<T>
    | Record<Extract<T, string>, any>
    | T
    | number
    | boolean
    | null
    | undefined;

  export interface FilteredClassArray<T extends string | symbol>
    extends Array<FilteredClassValue<T>> {}

  export type FilteredClassFunction<T extends string | symbol> = (
    ...classes: FilteredClassValue<T>[]
  ) => string;

  export type Clsx<T extends string | symbol = string> = FilteredClassFunction<
    T
  >;

  export default clsx as <T extends string | symbol = string>(
    ...classes: FilteredClassValue<T>[]
  ) => string;
}
