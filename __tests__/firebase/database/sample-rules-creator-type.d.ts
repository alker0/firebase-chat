export type SampleRulesKeys = 'sample1' | 'whole';

export interface SampleRulesStore
  extends Record<SampleRulesKeys, string | null> {}

export interface SampleRulesCreatorMap
  extends Record<SampleRulesKeys, () => string> {}

export interface SampleRulesKeyCheck {
  (targetKey: unknown): targetKey is SampleRulesKeys;
}

export interface SampleRulesCreatorMessage {
  rulesKey: SampleRulesKeys;
  rulesText: string;
}

export type SampleRulesCreatorTypes = {
  SampleRulesKeys: SampleRulesKeys;
  SampleRulesStore: SampleRulesStore;
  SampleRulesCreatorMap: SampleRulesCreatorMap;
  SampleRulesKeyCheck: SampleRulesKeyCheck;
  SampleRulesCreatorMessage: SampleRulesCreatorMessage;
};
