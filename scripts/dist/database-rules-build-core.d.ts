export declare const read = '.read';
export declare const write = '.write';
export declare const validate = '.validate';
export declare const indexOn = '.indexOn';
export interface RuleValue {
  (): string;
  length: RuleValue;
  isCaptured: boolean;
  isNum: boolean;
  isBool: boolean;
  isStringLiteral: boolean;
  rawValue: string;
  matches: (regexText: string) => RuleValue;
}
export declare const ruleValue: (
  currentValue: string,
  {
    isCaptured,
    isNum,
    isBool,
    isStringLiteral,
  }?: {
    isCaptured?: boolean;
    isNum?: boolean;
    isBool?: boolean;
    isStringLiteral?: boolean;
  },
) => RuleValue;
declare type RuleValueArg = string | number | boolean | RuleValue;
declare type RuleValueArgs = RuleValueArg[];
declare type Literals = readonly string[];
export declare const joinArrayValues: (values: RuleValueArgs) => string;
export declare const joinPaths: (paths: RuleValueArgs) => string;
export declare const joinTexts: (
  literalArgs: Literals,
  ...ruleValueArgs: RuleValueArgs
) => RuleValue;
export interface RuleRef {
  parent: (depth?: number) => RuleRef;
  child: (...paths: RuleValueArgs) => RuleRef;
  exists: () => RuleValue;
  isString: () => RuleValue;
  isNumber: () => RuleValue;
  isBoolean: () => RuleValue;
  val: (valOpts?: { isNum?: boolean; isBool?: boolean }) => RuleValue;
  hasChild: (...paths: RuleValueArgs) => RuleValue;
  hasChildren: (children: RuleValueArgs) => RuleValue;
}
export declare const ruleRef: (currentRef?: string) => RuleRef;
export declare const root: RuleRef;
export declare const data: RuleRef;
export declare const newData: RuleRef;
export declare const auth: {
  isNull: string;
  isNotNull: string;
  uid: RuleValue;
  token: {
    email: RuleValue;
    emailVerified: RuleValue;
    phoneNumber: RuleValue;
    name: RuleValue;
    sub: RuleValue;
    firebase: {
      identities: RuleValue;
      signInProvider: RuleValue;
    };
  };
  provider: RuleValue;
};
export declare const query: {
  orderByChild: (
    firstPath: RuleValueArg | null,
    ...paths: RuleValueArgs
  ) => RuleValue;
  orderByChildIsNull: string;
  orderByKey: RuleValue;
  orderByValue: RuleValue;
  orderByPriority: RuleValue;
  equalTo: RuleValue;
  startAt: RuleValue;
  endAt: RuleValue;
  limitToFirst: RuleValue;
  limitToLast: RuleValue;
};
export declare const now: RuleValue;
export declare type RuleExpArg = RuleValueArg;
export declare type RuleExpArgs = RuleExpArg[];
export declare const extractText: (
  text: RuleExpArg,
) => string | number | boolean;
export declare function getRuleResultFromRuleNode(
  ruleNode: RuleExpArg | (RuleExpArg | RuleExpArgs)[],
  withBracket: boolean,
): string;
export declare type RuleKey = typeof read | typeof write | typeof validate;
declare type IndexOnKey = typeof indexOn;
declare type ChildRuleObjectKey<T extends {}> = Extract<
  Exclude<keyof T, RuleKey | IndexOnKey>,
  string
>;
declare type SourceRuleValue = boolean | string | RuleValue | string[];
declare type SourceIndexOnValue = (string | RuleValue)[];
export declare type SourceRuleObject<T extends {}> = Record<
  keyof T & RuleKey,
  SourceRuleValue
> &
  Record<keyof T & IndexOnKey, SourceIndexOnValue> &
  {
    [K in ChildRuleObjectKey<T>]: K extends ChildRuleObjectKey<T>
      ? T[K]
      : never;
  };
declare type ResultRuleValue = string | boolean;
declare type ResultIndexOnValue = string[];
export declare type ResultRuleObject<T extends Record<string, any>> = Record<
  RuleKey,
  ResultRuleValue
> &
  Record<IndexOnKey, ResultIndexOnValue> &
  {
    [K in ChildRuleObjectKey<T>]: K extends ChildRuleObjectKey<T>
      ? ResultRuleObject<T[K]>
      : never;
  };
export declare function createRuleObject<
  T extends {},
  U extends ResultRuleObject<T>
>(srcObj: T & SourceRuleObject<T>): U;
export declare const join: (...texts: RuleExpArgs) => string;
export declare const bracket: (...texts: RuleExpArgs) => string;
export declare const exp: (
  literalArgs: Literals,
  ...jsArgs: RuleExpArgs
) => string;
export declare const indexOnChild: (...children: RuleValueArgs) => string[];
export {};
