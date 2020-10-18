import {
  StringifierInputMessage,
  StringifierOutputMessage,
} from './stringifier-message';

process.on('message', (ruleObject) => {
  if (typeof ruleObject === 'object') {
    const { rulesKey, rulesSource } = ruleObject as StringifierInputMessage;
    const result: StringifierOutputMessage = {
      rulesKey,
      rulesResult: JSON.stringify(rulesSource),
    };
    process.send?.(result);
  }
});
