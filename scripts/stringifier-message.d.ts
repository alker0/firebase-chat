import { ResultRuleObject } from './database-rules-build-core';

export interface StringifierInputMessage {
  rulesKey: string;
  rulesSource: {
    rules: ResultRuleObject;
  };
}
export interface StringifierOutputMessage {
  rulesKey: string;
  rulesResult: string;
}
