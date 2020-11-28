import { RuleValue } from './rule-value';
import { RuleValueArgs, joinPaths, joinArrayValues } from './build-utils';

export class RuleRef {
  readonly rawRef: string;

  constructor(currentRef: string) {
    this.rawRef = currentRef;
  }

  parent(depth = 1): RuleRef {
    return new RuleRef(
      `${this.rawRef}.${Array(depth).fill('parent()').join('.')}`,
    );
  }
  child(...paths: RuleValueArgs): RuleRef {
    return new RuleRef(`${this.rawRef}.child(${joinPaths(paths)})`);
  }
  exists(): RuleValue {
    return new RuleValue(`${this.rawRef}.exists()`);
  }
  isString(): RuleValue {
    return new RuleValue(`${this.rawRef}.isString()`);
  }
  isNumber(): RuleValue {
    return new RuleValue(`${this.rawRef}.isNumber()`);
  }
  isBoolean(): RuleValue {
    return new RuleValue(`${this.rawRef}.isBoolean()`);
  }
  val(
    valOpts?:
      | { isNum?: boolean | undefined; isBool?: boolean | undefined }
      | undefined,
  ): RuleValue {
    return new RuleValue(`${this.rawRef}.val()`, valOpts);
  }
  hasChild(...paths: RuleValueArgs): RuleValue {
    return new RuleValue(`${this.rawRef}.hasChild(${joinPaths(paths)})`);
  }
  hasChildren(children: RuleValueArgs): RuleValue {
    return new RuleValue(
      `${this.rawRef}.hasChildren([${joinArrayValues(children)}])`,
    );
  }
}

export function ruleRef(
  ...props: ConstructorParameters<typeof RuleRef>
): RuleRef {
  return new RuleRef(...props);
}
