const read = '.read';
const write = '.write';
const validate = '.validate';
const indexOn = '.indexOn';

const ruleValue = (
  currentValue,
  {
    isCaptured = false,
    isNum = false,
    isStringLiteral = false,
    isBooleanLiteral = false,
  } = {},
) => {
  function getCurrentResult() {
    if (isStringLiteral) {
      return `'${currentValue}'`;
    } else if (isBooleanLiteral) {
      return `${currentValue} === true`;
    } else {
      return currentValue;
    }
  }
  Object.defineProperty(getCurrentResult, 'length', {
    get: () => ruleValue(`${currentValue}.length`, { isNum: true }),
  });
  return Object.assign(getCurrentResult, {
    isCaptured,
    isNum: typeof currentValue === 'number' || isNum,
    isStringLiteral,
    isBooleanLiteral,
    rawValue: currentValue,

    matches: (regexText) =>
      ruleValue(`${currentValue}.matches(/${regexText}/)`, { isBool: true }),
    add: () => '',
    op: '',
  });
};

const fixIfNum = (callRawValue = false) => (ruleValueArg) => {
  if (ruleValueArg.isNum) {
    return `''+${ruleValueArg()}`;
  } else {
    switch (typeof ruleValueArg) {
      case 'function':
        return callRawValue ? ruleValueArg.rawValue : ruleValueArg();
      case 'string':
      case 'number':
        return `'${ruleValueArg}'`;
      default:
        throw new Error('Expected arg is only [string, number, function]');
    }
  }
};

const { joinArrayValues, joinPaths, joinTexts } = (() => {
  const isStringifiable = (target) =>
    ['string', 'number'].includes(typeof target);

  const getRuleValueStatus = (target) => {
    const targetIsStringifiable = isStringifiable(target);
    const targetIsStringLiteral =
      targetIsStringifiable || Boolean(target.isStringLiteral);
    const targetRawValue = String(
      targetIsStringifiable ? target : target.rawValue,
    );
    return [targetRawValue, targetIsStringLiteral];
  };

  const getPrefixAndSuffix = (
    firstArg,
    isSingleArg,
    firstIsStringLiteral,
    lastIsStringLiteral,
  ) => {
    if (isSingleArg) {
      if (firstArg.isNum) {
        return ["''+", ''];
      } else {
        return Array(2).fill(firstIsStringLiteral ? "'" : '');
      }
    } else {
      return [firstIsStringLiteral ? "'" : '', lastIsStringLiteral ? "'" : ''];
    }
  };

  const existsTagArgInfo = (literalArg, ruleValueArg) => [
    literalArg !== '',
    Boolean(ruleValueArg),
  ];

  const joinArrayValuesFn = (values) => values.map(fixIfNum()).join(',');

  const joinPathsFn = (paths) => {
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
  };

  const joinTextsFn = (literalArgs, ...ruleValueArgs) => {
    const firstLiteral = literalArgs[0];
    const firstRuleValueArg = ruleValueArgs[0];

    const [existsFirstLiteral, existsFirstRuleValue] = existsTagArgInfo(
      firstLiteral,
      firstRuleValueArg,
    );

    const [firstArg, firstIsStringLiteral] = existsFirstLiteral
      ? [firstLiteral, true]
      : [firstRuleValueArg, firstRuleValueArg.isStringLiteral];

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
  };

  return {
    joinArrayValues: joinArrayValuesFn,
    joinPaths: joinPathsFn,
    joinTexts: joinTextsFn,
  };
})();

const ruleRef = (currentRef = '') => ({
  parent: (depth = 1) =>
    ruleRef(`${currentRef}.${Array(depth).fill('parent()').join('.')}`),
  child: (...paths) => ruleRef(`${currentRef}.child(${joinPaths(paths)})`),

  exists: () => ruleValue(`${currentRef}.exists()`),
  isString: () => ruleValue(`${currentRef}.isString()`),
  isNumber: () => ruleValue(`${currentRef}.isNumber()`),
  isBoolean: () => ruleValue(`${currentRef}.isBoolean()`),
  val: (isNum = false) => ruleValue(`${currentRef}.val()`, { isNum }),
  hasChild: (...paths) =>
    ruleValue(`${currentRef}.hasChild(${joinPaths(paths)})`),
  hasChildren: (children) =>
    ruleValue(`${currentRef}.hasChildren([${joinArrayValues(children)}])`),
});

const root = ruleRef('root');
const data = ruleRef('data');
const newData = ruleRef('newData');

const auth = {
  isNull: 'auth === null',
  isNotNull: 'auth !== null',
  uid: ruleValue('auth.uid'),
  token: {
    email: ruleValue('auth.token.email'),
    emailVerified: ruleValue('auth.token.email_verified', {
      isBooleanLiteral: true,
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

const ruleOrdering = (currentOrdering) => {
  function getCurrentResult() {
    return currentOrdering;
  }
  return Object.assign(getCurrentResult, {
    equalTo: () => ruleOrdering(`${currentOrdering}.equelTo()`),
    startAt: () => ruleOrdering(`${currentOrdering}.startAt()`),
    endAt: () => ruleOrdering(`${currentOrdering}.endAt()`),
    limitToFirst: () => ruleOrdering(`${currentOrdering}.limitToFirst()`),
    limitToLast: () => ruleOrdering(`${currentOrdering}.limitToLast()`),
  });
};

const query = {
  orderByChild: (...paths) =>
    ruleOrdering(`query.orderByChild === ${joinPaths(paths)}`),
  orderByKey: () => ruleOrdering(`query.orderByKey()`),
  orderByValue: () => ruleOrdering(`query.orderByValue()`),
  orderByPriority: () => ruleOrdering(`query.orderByPriority()`),
};

const now = ruleValue('now', { isNum: true });

const extractText = (text) => (typeof text === 'function' ? text() : text);
const join = (...texts) => texts.map(extractText).join(' ');
const bracket = (...texts) => `(${join(...texts)})`;
const exp = (literalArgs, ...jsArgs) => {
  return literalArgs
    .map((literalArg, index) => {
      const jsArg = jsArgs[index];
      return `${literalArg}${extractText(jsArg ?? '')}`;
    })
    .join('');
};

const indexOnChild = (...children) => children.map(fixIfNum(true));
const zeroFill = () => {};

module.exports = {
  read,
  write,
  validate,
  indexOn,
  root,
  data,
  newData,
  auth,
  query,
  now,
  ruleValue,
  ruleRef,
  ruleOrdering,
  joinArrayValues,
  joinTexts,
  joinPaths,
  extractText,
  join,
  bracket,
  exp,
  indexOnChild,
  zeroFill,
};
