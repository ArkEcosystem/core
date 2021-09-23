"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readJSON = readJSON;
exports.evaluate = evaluate;
exports.tryRequire = tryRequire;
exports.wrapToArray = wrapToArray;
exports.wrapToMap = wrapToMap;
Object.defineProperty(exports, "getScripts", {
  enumerable: true,
  get: function get() {
    return _getScripts.default;
  }
});

var _vm = _interopRequireDefault(require("vm"));

var _getScripts = _interopRequireDefault(require("./get-scripts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function readJSON(filePath) {
  return require(filePath); // eslint-disable-line global-require
}

function evaluate(code) {
  const exports = {};
  const sandbox = {
    exports,
    module: {
      exports
    }
  };

  _vm.default.runInNewContext(code, sandbox);

  return sandbox.module.exports;
}

function tryRequire(module) {
  try {
    return require(module); // eslint-disable-line global-require
  } catch (e) {
    return null;
  }
}

function wrapToArray(obj) {
  if (!obj) {
    return [];
  }

  if (Array.isArray(obj)) {
    return obj;
  }

  return [obj];
}

function wrapToMap(obj) {
  if (!obj) {
    return {};
  }

  return obj;
}