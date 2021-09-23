"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parse = parse;
exports.getCustomConfig = getCustomConfig;
exports.loadConfig = loadConfig;

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var path = _interopRequireWildcard(require("path"));

var fs = _interopRequireWildcard(require("fs"));

var _ = require(".");

var _getScripts = _interopRequireDefault(require("./get-scripts"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parse(content) {
  try {
    return JSON.parse(content);
  } catch (error) {// not JSON format
  }

  try {
    return _jsYaml.default.safeLoad(content);
  } catch (error) {// not YAML format
  }

  try {
    return (0, _.evaluate)(`module.exports = ${content}`);
  } catch (error) {} // not valid JavaScript code
  // parse fail, return nothing


  return {};
}

function getCustomConfig(kind, filename, content, rootDir) {
  const scripts = (0, _getScripts.default)(filename, content);

  if (scripts.length === 0) {
    return null;
  }

  const script = scripts.find(s => s.split(/\s+/).includes(kind));

  if (script) {
    const commands = script.split('&&');
    const command = commands.find(c => c.startsWith(kind));

    if (command) {
      const args = command.split(/\s+/);
      const configIdx = args.findIndex(arg => ['--config', '-c'].includes(arg));

      if (configIdx !== -1 && args[configIdx + 1]) {
        const configFile = args[configIdx + 1];
        const configPath = path.resolve(rootDir, configFile);
        const configContent = fs.readFileSync(configPath);

        try {
          return JSON.parse(configContent);
        } catch (e) {
          return null;
        }
      }
    }
  }

  return null;
}

function loadConfig(flavour, filenameRegex, filename, content, rootDir) {
  const basename = path.basename(filename);

  if (filenameRegex.test(basename)) {
    const config = parse(content);
    return config;
  }

  const custom = getCustomConfig(flavour, filename, content, rootDir);

  if (custom) {
    return custom;
  }

  return null;
}