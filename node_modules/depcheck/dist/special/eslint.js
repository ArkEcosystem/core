"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseESLint;

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _requirePackageName = _interopRequireDefault(require("require-package-name"));

var _index = require("../utils/index");

var _linters = require("../utils/linters");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function requireConfig(preset, rootDir) {
  const presetPath = _path.default.isAbsolute(preset) ? preset : _path.default.resolve(rootDir, 'node_modules', preset);

  try {
    return require(presetPath); // eslint-disable-line global-require
  } catch (error) {
    return {}; // silently return nothing
  }
}
/**
 * Brings package name to correct format based on prefix
 * @param {string} name The name of the package.
 * @param {string} prefix Can be either "eslint-plugin", "eslint-config" or "eslint-formatter"
 * @returns {string} Normalized name of the package
 * @private
 * @see {@link https://github.com/eslint/eslint/blob/faf3c4eda0d27323630d0bc103a99dd0ecffe842/lib/util/naming.js#L25 ESLint}
 */


function normalizePackageName(name, prefix) {
  let normalizedName = name;

  const convertPathToPosix = p => _path.default.normalize(p).replace(/\\/g, '/');
  /**
   * On Windows, name can come in with Windows slashes instead of Unix slashes.
   * Normalize to Unix first to avoid errors later on.
   * https://github.com/eslint/eslint/issues/5644
   */


  if (normalizedName.indexOf('\\') > -1) {
    normalizedName = convertPathToPosix(normalizedName);
  }

  if (normalizedName.charAt(0) === '@') {
    /**
     * it's a scoped package
     * package name is the prefix, or just a username
     */
    const scopedPackageShortcutRegex = new RegExp(`^(@[^/]+)(?:/(?:${prefix})?)?$`);
    const scopedPackageNameRegex = new RegExp(`^${prefix}(-|$)`);

    if (scopedPackageShortcutRegex.test(normalizedName)) {
      normalizedName = normalizedName.replace(scopedPackageShortcutRegex, `$1/${prefix}`);
    } else if (!scopedPackageNameRegex.test(normalizedName.split('/')[1])) {
      /**
       * for scoped packages, insert the prefix after the first / unless
       * the path is already @scope/eslint or @scope/eslint-xxx-yyy
       */
      normalizedName = normalizedName.replace(/^@([^/]+)\/(.*)$/, `@$1/${prefix}-$2`);
    }
  } else if (normalizedName.indexOf(`${prefix}-`) !== 0) {
    normalizedName = `${prefix}-${normalizedName}`;
  }

  return normalizedName;
}

function resolvePresetPackage(preset, rootDir) {
  // inspired from https://github.com/eslint/eslint/blob/5b4a94e26d0ef247fe222dacab5749805d9780dd/lib/config/config-file.js#L347
  if (_path.default.isAbsolute(preset)) {
    return preset;
  }

  if (preset.startsWith('./') || preset.startsWith('../')) {
    return _path.default.resolve(rootDir, preset);
  }

  if (preset.startsWith('plugin:')) {
    const pluginName = preset.slice(7, preset.lastIndexOf('/'));
    return normalizePackageName(pluginName, 'eslint-plugin');
  }

  return normalizePackageName(preset, 'eslint-config');
}

function checkConfig(config, rootDir) {
  const parser = (0, _index.wrapToArray)(config.parser);
  const plugins = (0, _index.wrapToArray)(config.plugins).map(plugin => normalizePackageName(plugin, 'eslint-plugin'));
  const presets = (0, _index.wrapToArray)(config.extends).filter(preset => !['eslint:recommended', 'eslint:all'].includes(preset)).map(preset => resolvePresetPackage(preset, rootDir));
  const presetPackages = presets.filter(preset => !_path.default.isAbsolute(preset)).map(_requirePackageName.default);
  const presetDeps = (0, _lodash.default)(presets).map(preset => requireConfig(preset, rootDir)).map(presetConfig => checkConfig(presetConfig, rootDir)).flatten().value();
  return _lodash.default.union(parser, plugins, presetPackages, presetDeps);
}

const configNameRegex = /^\.eslintrc(\.(json|js|yml|yaml))?$/;

function parseESLint(content, filename, deps, rootDir) {
  const config = (0, _linters.loadConfig)('eslint', configNameRegex, filename, content, rootDir);

  if (config) {
    return checkConfig(config, rootDir);
  }

  const packageJsonPath = _path.default.resolve(rootDir, 'package.json');

  const resolvedFilePath = _path.default.resolve(rootDir, filename);

  if (resolvedFilePath === packageJsonPath) {
    const parsed = JSON.parse(content);

    if (parsed.eslintConfig) {
      return checkConfig(parsed.eslintConfig, rootDir);
    }
  }

  return [];
}

module.exports = exports.default;