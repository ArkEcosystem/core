"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseES6;

var _parser = require("@babel/parser");

function parseES6(content) {
  return (0, _parser.parse)(content, {
    sourceType: 'module'
  });
}

module.exports = exports.default;