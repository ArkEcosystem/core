"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseTSLint;

var path = _interopRequireWildcard(require("path"));

var _requirePackageName = _interopRequireDefault(require("require-package-name"));

var _linters = require("../utils/linters");

var _index = require("../utils/index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function resolvePresetPackage(preset, rootDir) {
  if (preset.startsWith('./') || preset.startsWith('../')) {
    return path.resolve(rootDir, preset);
  }

  return preset;
}

function checkConfig(config, rootDir) {
  return (0, _index.wrapToArray)(config.extends).filter(preset => !preset.startsWith('tslint:')).map(preset => resolvePresetPackage(preset, rootDir)).filter(preset => !path.isAbsolute(preset)).map(_requirePackageName.default);
}

const configNameRegex = /^tslint\.(json|yaml|yml)$/;
/**
 * Parses TSLint configuration for dependencies.
 *
 * TSLint uses node resolution to load inherited configurations.
 * More info on this can be found
 * [here](https://palantir.github.io/tslint/usage/configuration/).
 */

function parseTSLint(content, filename, deps, rootDir) {
  const config = (0, _linters.loadConfig)('tslint', configNameRegex, filename, content, rootDir);

  if (config) {
    return ['tslint', ...checkConfig(config, rootDir)];
  }

  return [];
}

module.exports = exports.default;