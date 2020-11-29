import { constructAssign } from './class-utils';

export class RuleValue {
  readonly rawValue: string;

  readonly isBool: boolean;
  readonly isNum: boolean;
  readonly isStringLiteral: boolean;

  constructor(
    currentValue: string,
    { isBool = false, isNum = false, isStringLiteral = false } = {},
  ) {
    constructAssign(this, {
      rawValue: currentValue,
      isBool,
      isNum,
      isStringLiteral,
    });
  }

  get length() {
    return new RuleValue(`${this.rawValue}.length`, { isNum: true });
  }

  toString() {
    if (this.isStringLiteral) {
      return `'${this.rawValue}'`;
    } else if (this.isBool) {
      return `${this.rawValue} === true`;
    } else {
      return this.rawValue;
    }
  }

  matches(regexText: string) {
    return new RuleValue(`${this.rawValue}.matches(/${regexText}/)`);
  }
}

export function ruleValue(
  ...props: ConstructorParameters<typeof RuleValue>
): RuleValue {
  return new RuleValue(...props);
}
