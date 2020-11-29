import { RuleValue } from './rule-value';
import { RuleRef } from './rule-ref';
import { RuleValueArg, RuleValueArgs, joinPaths } from './build-utils';

export const root = new RuleRef('root');
export const data = new RuleRef('data');
export const newData = new RuleRef('newData');

export const auth = {
  isNull: 'auth === null',
  isNotNull: 'auth !== null',
  uid: new RuleValue('auth.uid'),
  token: {
    email: new RuleValue('auth.token.email'),
    emailVerified: new RuleValue('auth.token.email_verified', {
      isBool: true,
    }),
    phoneNumber: new RuleValue('auth.token.phone_number'),
    name: new RuleValue('auth.token.name'),
    sub: new RuleValue('auth.token.sub'),
    firebase: {
      identities: new RuleValue('auth.token.firebase.identities'),
      signInProvider: new RuleValue('auth.token.firebase.sign_in_provider'),
    },
  },
  provider: new RuleValue('auth.provider'),
} as const;

export const query = {
  orderByChild: (firstPath: RuleValueArg | null, ...paths: RuleValueArgs) =>
    new RuleValue(
      `query.orderByChild === ${
        firstPath === null ? 'null' : joinPaths([firstPath, ...paths])
      }`,
    ),
  orderByChildIsNull: 'query.orderByChild === null',
  orderByKey: new RuleValue('query.orderByKey'),
  orderByValue: new RuleValue('query.orderByValue'),
  orderByPriority: new RuleValue('query.orderByPriority'),
  equalTo: new RuleValue(`query.equalTo`),
  startAt: new RuleValue('query.startAt'),
  endAt: new RuleValue('query.endAt'),
  limitToFirst: new RuleValue('query.limitToFirst', { isNum: true }),
  limitToLast: new RuleValue('query.limitToLast', { isNum: true }),
} as const;

export const now = new RuleValue('now', { isNum: true });
