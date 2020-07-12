type ClassNamesSwitch<K extends string> = {
    [P in K]?: boolean | null | undefined;
};

type ClassNamesFunctionProps<T extends string> =
    | ClassNamesSwitch<T>
    | T
    | null
    | undefined
    | false;

export interface ClassNamesFunction<T extends string> {
    (...args: ClassNamesFunctionProps<T>[]): string;
}

export type ClassNamesFunctionCreater = <T>() => ClassNamesFunction<T>

export const createClassNamesFunction: ClassNamesFunctionCreater
