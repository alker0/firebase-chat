import { writeFile } from 'fs/promises';
import { join } from 'path';
import { parentPort } from 'worker_threads';
import type { SampleRulesCreatorMessage } from './rules-test-utils';
import {
  SampleRulesKeys,
  sampleRulesStore,
  sampleRulesCreatorMap,
} from './sample-rules';

function sampleRulesKeyCheck(targetKey: unknown): targetKey is SampleRulesKeys {
  if (typeof targetKey === 'string') {
    return Object.keys(sampleRulesStore).includes(targetKey);
  } else {
    return false;
  }
}

function formatMessage(
  rulesKey: SampleRulesKeys,
  rulesText: string,
): SampleRulesCreatorMessage<SampleRulesKeys> {
  return {
    rulesKey,
    rulesText,
  };
}

parentPort?.on('message', (message) => {
  if (sampleRulesKeyCheck(message)) {
    const storeValue = sampleRulesStore[message];
    if (storeValue) {
      parentPort?.postMessage(formatMessage(message, storeValue));
    } else {
      try {
        const stringified = sampleRulesCreatorMap[message]();
        sampleRulesStore[message] = stringified;
        writeFile(
          join(process.cwd(), 'rules-creator-result.gitskip.json'),
          stringified,
          'utf-8',
        );
        parentPort?.postMessage(formatMessage(message, stringified));
      } catch (error) {
        writeFile(
          join(process.cwd(), 'rules-creator-error.gitskip.txt'),
          error.message,
          'utf-8',
        );
      }
    }
  }
});
