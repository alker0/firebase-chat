import { writeFile } from 'fs/promises';
import { resolve as pathResolve } from 'path';
import { getTalkerRules } from './rtdb-rules';

function createRulesObjectText<T>(rulesObject: T): string {
  return JSON.stringify({ rules: rulesObject });
}

const outputPath = process.argv[2];

if (outputPath) {
  writeFile(
    pathResolve(process.cwd(), outputPath),
    createRulesObjectText(getTalkerRules()),
    'utf-8',
  ).then(() => console.log('Successed.'));
} else {
  throw new Error('Output path is not specified.');
}
