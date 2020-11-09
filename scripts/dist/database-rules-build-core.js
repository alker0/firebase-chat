#!/usr/local/bin/yarn ts-node-script
"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexOnChild = exports.exp = exports.bracket = exports.join = exports.createRuleObject = exports.getRuleResultFromRuleNode = exports.extractText = exports.now = exports.query = exports.auth = exports.newData = exports.data = exports.root = exports.ruleRef = exports.joinTexts = exports.joinPaths = exports.joinArrayValues = exports.ruleValue = exports.indexOn = exports.validate = exports.write = exports.read = void 0;
exports.read = '.read';
exports.write = '.write';
exports.validate = '.validate';
exports.indexOn = '.indexOn';
exports.ruleValue = (currentValue, { isCaptured = false, isNum = false, isBool = false, isStringLiteral = false, } = {}) => {
    function getCurrentResult() {
        if (isStringLiteral) {
            return `'${currentValue}'`;
        }
        else if (isBool) {
            return `${currentValue} === true`;
        }
        else {
            return currentValue;
        }
    }
    Object.defineProperty(getCurrentResult, 'length', {
        get: () => exports.ruleValue(`${currentValue}.length`, { isNum: true }),
    });
    return Object.assign(getCurrentResult, {
        isCaptured,
        isNum: typeof currentValue === 'number' || isNum,
        isBool,
        isStringLiteral,
        rawValue: currentValue,
        matches: (regexText) => exports.ruleValue(`${currentValue}.matches(/${regexText}/)`),
    });
};
const IsRuleValue = (target) => {
    return !['string', 'number'].includes(typeof target);
};
const fixIfNum = (callRawValue = false) => (ruleValueArg) => {
    switch (typeof ruleValueArg) {
        case 'function':
            if (ruleValueArg.isNum) {
                return `''+${ruleValueArg()}`;
            }
            else if (callRawValue) {
                return ruleValueArg.rawValue;
            }
            else {
                return ruleValueArg();
            }
        case 'string':
        case 'number':
            return `'${ruleValueArg}'`;
        default:
            throw new Error('Expected arg is only [string, number, function]');
    }
};
_a = (() => {
    const isStringifiable = (target) => !IsRuleValue(target);
    const getRuleValueStatus = (target) => {
        if (isStringifiable(target)) {
            return [String(target), true];
        }
        else if (typeof target === 'boolean') {
            return [target, false];
        }
        else {
            return [target.rawValue, target.isStringLiteral];
        }
    };
    const getPrefixAndSuffix = (firstArg, isSingleArg, firstIsStringLiteral, lastIsStringLiteral) => {
        if (isSingleArg) {
            if (!IsRuleValue(firstArg) || firstArg.isNum) {
                return ["''+", ''];
            }
            else {
                return Array(2).fill(firstIsStringLiteral ? "'" : '');
            }
        }
        else {
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
        const { rawValue: result, isStringLiteral: lastIsStringLiteral, } = paths.slice(1).reduce((prev, next) => {
            const [nextRawValue, nextIsStringLiteral] = getRuleValueStatus(next);
            const sepLeft = prev.isStringLiteral ? '/' : "+'/";
            const sepRight = nextIsStringLiteral ? '' : "'+";
            return {
                rawValue: `${prev.rawValue}${sepLeft}${sepRight}${nextRawValue}`,
                isStringLiteral: nextIsStringLiteral,
            };
        }, { rawValue: firstRawValue, isStringLiteral: firstIsStringLiteral });
        const [prefix, suffix] = getPrefixAndSuffix(paths[0], paths.length === 1, firstIsStringLiteral, lastIsStringLiteral);
        return `${prefix}${result}${suffix}`;
    };
    const joinTextsFn = (literalArgs, ...ruleValueArgs) => {
        const firstLiteral = literalArgs[0];
        const firstRuleValueArg = ruleValueArgs[0];
        const [existsFirstLiteral, existsFirstRuleValue] = existsTagArgInfo(firstLiteral, firstRuleValueArg);
        const [firstArg, firstIsStringLiteral] = existsFirstLiteral
            ? [firstLiteral, true]
            : [
                firstRuleValueArg,
                !IsRuleValue(firstRuleValueArg) || firstRuleValueArg.isStringLiteral,
            ];
        const { rawValue: result, isStringLiteral: lastIsStringLiteral, } = literalArgs.reduce((prev, nextLiteral, index) => {
            const nextRuleValue = ruleValueArgs[index];
            const [existsNextLiteral, existsNextRuleValue] = existsTagArgInfo(nextLiteral, nextRuleValue);
            if (existsNextLiteral) {
                const sepBeforeNextLiteral = prev.isStringLiteral ? '' : "+'";
                const joinedUntilNextLiteral = `${prev.rawValue}${sepBeforeNextLiteral}${nextLiteral}`;
                if (existsNextRuleValue) {
                    const [nextRawRuleValue, nextIsStringLiteral] = getRuleValueStatus(nextRuleValue);
                    const sepAfterNextLiteral = nextIsStringLiteral ? '' : "'+";
                    return {
                        rawValue: `${joinedUntilNextLiteral}${sepAfterNextLiteral}${nextRawRuleValue}`,
                        isStringLiteral: nextIsStringLiteral,
                    };
                }
                else {
                    return {
                        rawValue: joinedUntilNextLiteral,
                        isStringLiteral: true,
                    };
                }
            }
            else if (existsNextRuleValue) {
                const [nextRawRuleValue, nextIsStringLiteral] = getRuleValueStatus(nextRuleValue);
                const sep = nextIsStringLiteral || prev.isFirst ? '' : "'";
                return {
                    rawValue: `${prev.rawValue}${sep}${nextRawRuleValue}`,
                    isStringLiteral: nextIsStringLiteral,
                };
            }
            else {
                return prev;
            }
        }, { rawValue: '', isStringLiteral: true, isFirst: true });
        const [prefix, suffix] = getPrefixAndSuffix(firstArg, !existsFirstRuleValue || literalArgs[1] === '', firstIsStringLiteral, lastIsStringLiteral);
        return exports.ruleValue(`${prefix}${result}${suffix}`);
    };
    return {
        joinArrayValues: joinArrayValuesFn,
        joinPaths: joinPathsFn,
        joinTexts: joinTextsFn,
    };
})(), exports.joinArrayValues = _a.joinArrayValues, exports.joinPaths = _a.joinPaths, exports.joinTexts = _a.joinTexts;
exports.ruleRef = (currentRef = '') => ({
    raw: currentRef,
    parent: (depth = 1) => exports.ruleRef(`${currentRef}.${Array(depth).fill('parent()').join('.')}`),
    child: (...paths) => exports.ruleRef(`${currentRef}.child(${exports.joinPaths(paths)})`),
    exists: () => exports.ruleValue(`${currentRef}.exists()`),
    isString: () => exports.ruleValue(`${currentRef}.isString()`),
    isNumber: () => exports.ruleValue(`${currentRef}.isNumber()`),
    isBoolean: () => exports.ruleValue(`${currentRef}.isBoolean()`),
    val: (valOpts) => exports.ruleValue(`${currentRef}.val()`, valOpts),
    hasChild: (...paths) => exports.ruleValue(`${currentRef}.hasChild(${exports.joinPaths(paths)})`),
    hasChildren: (children) => exports.ruleValue(`${currentRef}.hasChildren([${exports.joinArrayValues(children)}])`),
});
exports.root = exports.ruleRef('root');
exports.data = exports.ruleRef('data');
exports.newData = exports.ruleRef('newData');
exports.auth = {
    isNull: 'auth === null',
    isNotNull: 'auth !== null',
    uid: exports.ruleValue('auth.uid'),
    token: {
        email: exports.ruleValue('auth.token.email'),
        emailVerified: exports.ruleValue('auth.token.email_verified', {
            isBool: true,
        }),
        phoneNumber: exports.ruleValue('auth.token.phone_number'),
        name: exports.ruleValue('auth.token.name'),
        sub: exports.ruleValue('auth.token.sub'),
        firebase: {
            identities: exports.ruleValue('auth.token.firebase.identities'),
            signInProvider: exports.ruleValue('auth.token.firebase.sign_in_provider'),
        },
    },
    provider: exports.ruleValue('auth.provider'),
};
exports.query = {
    orderByChild: (firstPath, ...paths) => exports.ruleValue(`query.orderByChild === ${firstPath === null ? 'null' : exports.joinPaths([firstPath, ...paths])}`),
    orderByChildIsNull: 'query.orderByChild === null',
    orderByKey: exports.ruleValue('query.orderByKey'),
    orderByValue: exports.ruleValue('query.orderByValue'),
    orderByPriority: exports.ruleValue('query.orderByPriority'),
    equalTo: exports.ruleValue(`query.equalTo`),
    startAt: exports.ruleValue('query.startAt'),
    endAt: exports.ruleValue('query.endAt'),
    limitToFirst: exports.ruleValue('query.limitToFirst', { isNum: true }),
    limitToLast: exports.ruleValue('query.limitToLast', { isNum: true }),
};
exports.now = exports.ruleValue('now', { isNum: true });
exports.extractText = (text) => typeof text === 'function' ? text() : text;
function getRuleResultFromRuleNode(ruleNode, withBracket) {
    switch (typeof ruleNode) {
        case 'string':
            return ruleNode;
        case 'number':
        case 'boolean':
            return ruleNode.toString();
        case 'function':
            return ruleNode();
    }
    const ruleNodeValue = ruleNode
        .map((ruleNodeElm) => getRuleResultFromRuleNode(ruleNodeElm, true))
        .join(' ');
    if (withBracket) {
        return `(${ruleNodeValue})`;
    }
    else {
        return ruleNodeValue;
    }
}
exports.getRuleResultFromRuleNode = getRuleResultFromRuleNode;
function assertsSourceRuleObject(srcObj) { }
function boolOrExtract(srcObj, key) {
    const srcValue = srcObj[key];
    if (typeof srcValue === 'boolean') {
        return srcValue;
    }
    else {
        return getRuleResultFromRuleNode(srcValue, false);
    }
}
function createRuleObject(srcObj) {
    assertsSourceRuleObject(srcObj);
    return Object.keys(srcObj).reduce((result, prop) => {
        switch (prop) {
            case exports.read:
            case exports.write:
            case exports.validate:
                /* eslint-disable no-param-reassign */
                result[prop] = boolOrExtract(srcObj, prop);
                break;
            case exports.indexOn:
                result[prop] = srcObj[prop].map((srcElement) => {
                    switch (typeof srcElement) {
                        case 'string':
                            return srcElement;
                        default:
                            return srcElement();
                    }
                });
                break;
            default:
                result[prop] = createRuleObject(srcObj[prop]);
                break;
        }
        /* eslint-enable no-param-reassign */
        return result;
    }, {});
}
exports.createRuleObject = createRuleObject;
exports.join = (...texts) => getRuleResultFromRuleNode(texts, false);
exports.bracket = (...texts) => getRuleResultFromRuleNode(texts, true);
exports.exp = (literalArgs, ...jsArgs) => {
    return literalArgs
        .map((literalArg, index) => {
        const jsArg = jsArgs[index];
        return `${literalArg}${exports.extractText(jsArg !== null && jsArg !== void 0 ? jsArg : '')}`;
    })
        .join('');
};
exports.indexOnChild = (...children) => children.map(fixIfNum(true));
