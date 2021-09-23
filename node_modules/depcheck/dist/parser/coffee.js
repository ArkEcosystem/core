"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseCoffeeScript;

var _depsRegex = _interopRequireDefault(require("deps-regex"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const re = new _depsRegex.default({
  matchES6: false
});

function parseCoffeeScript(content) {
  return re.getDependencies(content);
}

module.exports = exports.default;