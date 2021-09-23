"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseSASS;

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _requirePackageName = _interopRequireDefault(require("require-package-name"));

var _nodeSassTildeImporter = _interopRequireDefault(require("node-sass-tilde-importer"));

var _utils = require("../utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sass = (0, _utils.tryRequire)('node-sass');

function parseSASS(content, filePath, deps, rootDir) {
  const _sass$renderSync = sass.renderSync({
    file: filePath,
    includePaths: [_path.default.dirname(filePath)],
    importer: _nodeSassTildeImporter.default
  }),
        stats = _sass$renderSync.stats;

  const result = (0, _lodash.default)(stats.includedFiles).map(file => _path.default.relative(rootDir, file)).filter(file => file.indexOf('node_modules') === 0) // refer to node_modules
  .map(file => file.replace(/\\/g, '/')) // normalize paths in Windows
  .map(file => file.substring('node_modules/'.length)) // avoid heading slash
  .map(_requirePackageName.default).uniq().value();
  return result;
}

module.exports = exports.default;