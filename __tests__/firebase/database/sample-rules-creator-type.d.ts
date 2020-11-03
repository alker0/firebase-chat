import { SampleRulesCreatorMessage } from './rules-test-utils';

export type SampleRulesKeys = 'sample1' | 'whole';

export interface SampleRulesStore
  extends Record<SampleRulesKeys, string | null> {}

export interface SampleRulesCreatorMap
  extends Record<SampleRulesKeys, () => string> {}

export interface SampleRulesKeyCheck {
  (targetKey: unknown): targetKey is SampleRulesKeys;
}

export type SampleRulesCreatorTypes = {
  SampleRulesKeys: SampleRulesKeys;
  SampleRulesStore: SampleRulesStore;
  SampleRulesCreatorMap: SampleRulesCreatorMap;
  SampleRulesKeyCheck: SampleRulesKeyCheck;
  SampleRulesCreatorMessage: SampleRulesCreatorMessage<SampleRulesKeys>;
};
