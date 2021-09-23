"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearCache = clearCache;
exports.default = getScripts;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const scriptCache = {};

function clearCache() {
  Object.keys(scriptCache).forEach(key => {
    scriptCache[key] = undefined;
  });
}

function getCacheOrFile(key, fn) {
  if (scriptCache[key]) {
    return scriptCache[key];
  }

  const value = fn();
  scriptCache[key] = value;
  return value;
}

const travisCommands = [// Reference: http://docs.travis-ci.com/user/customizing-the-build/#The-Build-Lifecycle
'before_install', 'install', 'before_script', 'script', 'after_success or after_failure', 'before_deploy', 'after_deploy', 'after_script'];

function getScripts(filepath, content = null) {
  return getCacheOrFile(filepath, () => {
    const basename = _path.default.basename(filepath);

    const fileContent = content !== null ? content : _fs.default.readFileSync(filepath, 'utf-8');

    if (basename === 'package.json') {
      return _lodash.default.values(JSON.parse(fileContent).scripts || {});
    }

    if (basename === '.travis.yml') {
      const metadata = _jsYaml.default.safeLoad(content) || {};
      return (0, _lodash.default)(travisCommands).map(cmd => metadata[cmd] || []).flatten().value();
    }

    return [];
  });
}