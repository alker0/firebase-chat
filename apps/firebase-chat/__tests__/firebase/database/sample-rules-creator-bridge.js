// @ts-check
const { workerData } = require('worker_threads');

/**
 * @typedef { import('./rules-factory').RulesFactoryOptions } Options
 */

/** @type Options */
const options = workerData;
require('ts-node').register(options.tsNodeOption);
require(options.creatorTsAbsPath);
