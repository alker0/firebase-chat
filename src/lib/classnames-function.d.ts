type ClassNamesStatus<K extends string> = {
    [P in K]?: boolean | null | undefined;
};

type ClassNamesFunctionParams<T extends string> =
    | ClassNamesStatus<T>
    | T
    | null
    | undefined
    | false;

export interface ClassNamesFunction<T extends string> {
    (...args: ClassNamesFunctionParams<T>[]): string;
}

export type ClassNamesFunctionCreater = <T extends string>() => ClassNamesFunction<T>

export const createClassNamesFunction: ClassNamesFunctionCreater
