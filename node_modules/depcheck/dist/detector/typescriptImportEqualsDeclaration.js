"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = detectTypescriptImportEqualsDeclaration;

function detectTypescriptImportEqualsDeclaration(node) {
  return node.type === 'TSImportEqualsDeclaration' && node.moduleReference && node.moduleReference.expression ? [node.moduleReference.expression.value] : [];
}

module.exports = exports.default;