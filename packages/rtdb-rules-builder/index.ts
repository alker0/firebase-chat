export const read = '.read';
export const write = '.write';
export const validate = '.validate';
export const indexOn = '.indexOn';

export interface RuleValue {
  rawValue: string;
  isCaptured: boolean;
  isNum: boolean;
  isBool: boolean;
  isStringLiteral: boolean;
  length: RuleValue;
  toString(): string;
  matches: (regexText: string) => RuleValue;
}

export function ruleValue(
  currentValue: string,
  {
    isCaptured = false,
    isNum = false,
    isBool = false,
    isStringLiteral = false,
  } = {},
): RuleValue {
  return {
    isCaptured,
    isNum: typeof currentValue === 'number' || isNum,
    isBool,
    isStringLiteral,
    rawValue: currentValue,
    toString() {
      if (isStringLiteral) {
        return `'${currentValue}'`;
      } else if (isBool) {
        return `${currentValue} === true`;
      } else {
        return currentValue;
      }
    },
    get length() {
      return ruleValue(`${currentValue}.length`, { isNum: true });
    },
    matches: (regexText: string) =>
      ruleValue(`${currentValue}.matches(/${regexText}/)`),
  };
}

type RuleValueArg = string | number | boolean | RuleValue;
type RuleValueArgs = RuleValueArg[];
type Literals = readonly string[];

function IsRuleValue(target: RuleValueArg): target is RuleValue {
  return !['string', 'number'].includes(typeof target);
}

function fixIfNum(callRawValue = false) {
  return function fixIfNumRunner(ruleValueArg: RuleValueArg): string {
    switch (typeof ruleValueArg) {
      case 'object':
        if (ruleValueArg.isNum) {
          return `''+${ruleValueArg}`;
        } else if (callRawValue) {
          return ruleValueArg.rawValue;
        } else {
          return ruleValueArg.toString();
        }
      case 'string':
      case 'number':
        return `'${ruleValueArg}'`;
      default:
        throw new Error('Expected arg is only [string, number, RuleValue]');
    }
  };
}

export const { joinArrayValues, joinPaths, joinTexts } = (() => {
  function isStringifiable(target: RuleValueArg): target is string | number {
    return !IsRuleValue(target);
  }

  function getRuleValueStatus(
    target: RuleValueArg,
  ): [string | boolean, boolean] {
    if (isStringifiable(target)) {
      return [String(target), true];
    } else if (typeof target === 'boolean') {
      return [target, false];
    } else {
      return [target.rawValue, target.isStringLiteral];
    }
  }

  function getPrefixAndSuffix(
    firstArg: RuleValueArg,
    isSingleArg: boolean,
    firstIsStringLiteral: boolean,
    lastIsStringLiteral: boolean,
  ) {
    if (isSingleArg) {
      if (!IsRuleValue(firstArg) || firstArg.isNum) {
        return ["''+", ''];
      } else {
        return Array(2).fill(firstIsStringLiteral ? "'" : '');
      }
    } else {
      return [firstIsStringLiteral ? "'" : '', lastIsStringLiteral ? "'" : ''];
    }
  }

  function existsTagArgInfo(literalArg: string, ruleValueArg: unknown) {
    return [literalArg !== '', Boolean(ruleValueArg)];
  }

  function joinArrayValuesFn(values: RuleValueArgs) {
    return values.map(fixIfNum()).join(',');
  }

  function joinPathsFn(paths: RuleValueArgs) {
    const [firstRawValue, firstIsStringLiteral] = getRuleValueStatus(paths[0]);
    const {
      rawValue: result,
      isStringLiteral: lastIsStringLiteral,
    } = paths.slice(1).reduce(
      (prev, next) => {
        const [nextRawValue, nextIsStringLiteral] = getRuleValueStatus(next);
        const sepLeft = prev.isStringLiteral ? '/' : "+'/";
        const sepRight = nextIsStringLiteral ? '' : "'+";
        return {
          rawValue: `${prev.rawValue}${sepLeft}${sepRight}${nextRawValue}`,
          isStringLiteral: nextIsStringLiteral,
        };
      },
      { rawValue: firstRawValue, isStringLiteral: firstIsStringLiteral },
    );

    const [prefix, suffix] = getPrefixAndSuffix(
      paths[0],
      paths.length === 1,
      firstIsStringLiteral,
      lastIsStringLiteral,
    );

    return `${prefix}${result}${suffix}`;
  }

  function joinTextsFn(literalArgs: Literals, ...ruleValueArgs: RuleValueArgs) {
    const firstLiteral = literalArgs[0];
    const firstRuleValueArg = ruleValueArgs[0];

    const [existsFirstLiteral, existsFirstRuleValue] = existsTagArgInfo(
      firstLiteral,
      firstRuleValueArg,
    );

    const [firstArg, firstIsStringLiteral] = existsFirstLiteral
      ? [firstLiteral, true]
      : [
          firstRuleValueArg,
          !IsRuleValue(firstRuleValueArg) || firstRuleValueArg.isStringLiteral,
        ];

    const {
      rawValue: result,
      isStringLiteral: lastIsStringLiteral,
    } = literalArgs.reduce(
      (prev, nextLiteral, index) => {
        const nextRuleValue = ruleValueArgs[index];

        const [existsNextLiteral, existsNextRuleValue] = existsTagArgInfo(
          nextLiteral,
          nextRuleValue,
        );

        if (existsNextLiteral) {
          const sepBeforeNextLiteral = prev.isStringLiteral ? '' : "+'";
          const joinedUntilNextLiteral = `${prev.rawValue}${sepBeforeNextLiteral}${nextLiteral}`;

          if (existsNextRuleValue) {
            const [nextRawRuleValue, nextIsStringLiteral] = getRuleValueStatus(
              nextRuleValue,
            );
            const sepAfterNextLiteral = nextIsStringLiteral ? '' : "'+";
            return {
              rawValue: `${joinedUntilNextLiteral}${sepAfterNextLiteral}${nextRawRuleValue}`,
              isStringLiteral: nextIsStringLiteral,
            };
          } else {
            return {
              rawValue: joinedUntilNextLiteral,
              isStringLiteral: true,
            };
          }
        } else if (existsNextRuleValue) {
          const [nextRawRuleValue, nextIsStringLiteral] = getRuleValueStatus(
            nextRuleValue,
          );
          const sep = nextIsStringLiteral || prev.isFirst ? '' : "'";
          return {
            rawValue: `${prev.rawValue}${sep}${nextRawRuleValue}`,
            isStringLiteral: nextIsStringLiteral,
          };
        } else {
          return prev;
        }
      },
      { rawValue: '', isStringLiteral: true, isFirst: true },
    );

    const [prefix, suffix] = getPrefixAndSuffix(
      firstArg,
      !existsFirstRuleValue || literalArgs[1] === '',
      firstIsStringLiteral,
      lastIsStringLiteral,
    );

    return ruleValue(`${prefix}${result}${suffix}`);
  }

  return {
    joinArrayValues: joinArrayValuesFn,
    joinPaths: joinPathsFn,
    joinTexts: joinTextsFn,
  };
})();

export interface RuleRef {
  rawRef: string;
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

export const ruleRef = (currentRef = ''): RuleRef => ({
  rawRef: currentRef,
  parent: (depth = 1) =>
    ruleRef(`${currentRef}.${Array(depth).fill('parent()').join('.')}`),
  child: (...paths: RuleValueArgs) =>
    ruleRef(`${currentRef}.child(${joinPaths(paths)})`),

  exists: () => ruleValue(`${currentRef}.exists()`),
  isString: () => ruleValue(`${currentRef}.isString()`),
  isNumber: () => ruleValue(`${currentRef}.isNumber()`),
  isBoolean: () => ruleValue(`${currentRef}.isBoolean()`),
  val: (valOpts) => ruleValue(`${currentRef}.val()`, valOpts),
  hasChild: (...paths: RuleValueArgs) =>
    ruleValue(`${currentRef}.hasChild(${joinPaths(paths)})`),
  hasChildren: (children: RuleValueArgs) =>
    ruleValue(`${currentRef}.hasChildren([${joinArrayValues(children)}])`),
});

export const root = ruleRef('root');
export const data = ruleRef('data');
export const newData = ruleRef('newData');

export const auth = {
  isNull: 'auth === null',
  isNotNull: 'auth !== null',
  uid: ruleValue('auth.uid'),
  token: {
    email: ruleValue('auth.token.email'),
    emailVerified: ruleValue('auth.token.email_verified', {
      isBool: true,
    }),
    phoneNumber: ruleValue('auth.token.phone_number'),
    name: ruleValue('auth.token.name'),
    sub: ruleValue('auth.token.sub'),
    firebase: {
      identities: ruleValue('auth.token.firebase.identities'),
      signInProvider: ruleValue('auth.token.firebase.sign_in_provider'),
    },
  },
  provider: ruleValue('auth.provider'),
};

export const query = {
  orderByChild: (firstPath: RuleValueArg | null, ...paths: RuleValueArgs) =>
    ruleValue(
      `query.orderByChild === ${
        firstPath === null ? 'null' : joinPaths([firstPath, ...paths])
      }`,
    ),
  orderByChildIsNull: 'query.orderByChild === null',
  orderByKey: ruleValue('query.orderByKey'),
  orderByValue: ruleValue('query.orderByValue'),
  orderByPriority: ruleValue('query.orderByPriority'),
  equalTo: ruleValue(`query.equalTo`),
  startAt: ruleValue('query.startAt'),
  endAt: ruleValue('query.endAt'),
  limitToFirst: ruleValue('query.limitToFirst', { isNum: true }),
  limitToLast: ruleValue('query.limitToLast', { isNum: true }),
};

export const now = ruleValue('now', { isNum: true });

export type RuleExpArg = RuleValueArg;
export type RuleExpArgs = RuleExpArg[];

export function getRuleResultFromRuleNode(
  ruleNode: RuleExpArg | (RuleExpArg | RuleExpArgs)[],
  withBracket: boolean,
): string {
  if (Array.isArray(ruleNode)) {
    const ruleNodeValue = ruleNode
      .map((ruleNodeElm) => getRuleResultFromRuleNode(ruleNodeElm, true))
      .join(' ');
    if (withBracket) {
      return `(${ruleNodeValue})`;
    } else {
      return ruleNodeValue;
    }
  } else {
    return ruleNode.toString();
  }
}

export type RuleKey = typeof read | typeof write | typeof validate;
type IndexOnKey = typeof indexOn;
type ChildRuleObjectKey<T extends {}> = Extract<
  Exclude<keyof T, RuleKey | IndexOnKey>,
  string
>;

type SourceRuleValue = boolean | string | RuleValue | string[];
type SourceIndexOnValue = (string | RuleValue)[];

export type SourceRuleObject<T extends {}> = Record<
  keyof T & RuleKey,
  SourceRuleValue
> &
  Record<keyof T & IndexOnKey, SourceIndexOnValue> &
  {
    [K in ChildRuleObjectKey<T>]: K extends ChildRuleObjectKey<T>
      ? T[K]
      : never;
  };

type ResultRuleValue = string | boolean;
type ResultIndexOnValue = string[];

export type ResultRuleObject<T extends Record<string, any>> = Record<
  RuleKey,
  ResultRuleValue
> &
  Record<IndexOnKey, ResultIndexOnValue> &
  {
    [K in ChildRuleObjectKey<T>]: K extends ChildRuleObjectKey<T>
      ? ResultRuleObject<T[K]>
      : never;
  };

function assertsSourceRuleObject<T>(
  srcObj: unknown,
): asserts srcObj is SourceRuleObject<T> {}

function boolOrExtract<T extends {}>(
  srcObj: T & SourceRuleObject<T>,
  key: RuleKey,
): boolean | string {
  const srcValue = srcObj[key as Extract<keyof T, RuleKey>];
  if (typeof srcValue === 'boolean') {
    return srcValue as boolean;
  } else {
    return getRuleResultFromRuleNode(srcValue, false);
  }
}

export function createRuleObject<T extends {}, U extends ResultRuleObject<T>>(
  srcObj: T & SourceRuleObject<T>,
): U {
  assertsSourceRuleObject<T>(srcObj);
  return Object.keys(srcObj).reduce((result, prop) => {
    switch (prop) {
      case read:
      case write:
      case validate:
        /* eslint-disable no-param-reassign */
        result[prop] = boolOrExtract<T>(srcObj, prop);
        break;
      case indexOn:
        result[prop] = srcObj[prop as IndexOnKey & keyof T].map(String);
        break;
      default:
        result[
          prop as ChildRuleObjectKey<SourceRuleObject<T>>
        ] = createRuleObject(
          srcObj[prop as keyof T] as any,
        ) as U[ChildRuleObjectKey<SourceRuleObject<T>>];
        break;
    }
    /* eslint-enable no-param-reassign */
    return result;
  }, {} as U);
}

export function ruleJoin(...texts: RuleExpArgs) {
  return getRuleResultFromRuleNode(texts, false);
}
export function bracket(...texts: RuleExpArgs) {
  return getRuleResultFromRuleNode(texts, true);
}

export function indexOnChild(...children: RuleValueArgs) {
  return children.map(fixIfNum(true));
}
