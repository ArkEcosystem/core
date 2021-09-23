"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAtTypesName = getAtTypesName;

var _lodash = _interopRequireDefault(require("lodash"));

var _builtinModules = _interopRequireDefault(require("builtin-modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable import/prefer-default-export */
const orgDepRegex = /@(.*?)\/(.*)/; // The name of the DefinitelyTyped package for a given package

function getAtTypesName(dep) {
  let pkgName;

  if (_lodash.default.includes(_builtinModules.default, dep)) {
    pkgName = 'node';
  } else {
    const match = orgDepRegex.exec(dep);
    pkgName = match ? `${match[1]}__${match[2]}` : dep;
  }

  return `@types/${pkgName}`;
}