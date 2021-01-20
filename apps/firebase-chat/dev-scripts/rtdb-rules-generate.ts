import { writeFile } from 'fs/promises';
import { resolve as pathResolve } from 'path';
import { getTalkerRules } from './rtdb-rules';

function createRulesObjectText<T>(rulesObject: T): string {
  return JSON.stringify({ rules: rulesObject });
}

const args = process.argv.slice(2);

const firstArg = args[0];

let outputPath = firstArg;
if (!firstArg) {
  outputPath = process.env.RTDB_RULES_GENERATE_OUTPUT!;
}

if (outputPath) {
  const outputFilePath = pathResolve(process.cwd(), outputPath);
  writeFile(
    outputFilePath,
    createRulesObjectText(getTalkerRules()),
    'utf-8',
  ).then(() =>
    console.log(`A RTDB rules file is generated into ${outputFilePath}`),
  );
} else {
  throw new Error(
    `Output path must be specified (via the argument or RTDB_RULES_GENERATE_OUTPUT).`,
  );
}
