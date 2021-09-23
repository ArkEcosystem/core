"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseFerossStandard;

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseFerossStandard(content, filePath, deps, rootDir) {
  const packageJsonPath = _path.default.resolve(rootDir, 'package.json');

  const resolvedFilePath = _path.default.resolve(filePath);

  if (resolvedFilePath === packageJsonPath && deps.indexOf('standard') !== -1) {
    const metadata = JSON.parse(content);
    const config = metadata.standard || {};
    const parser = config.parser;
    return parser ? [parser] : [];
  }

  return [];
}

module.exports = exports.default;