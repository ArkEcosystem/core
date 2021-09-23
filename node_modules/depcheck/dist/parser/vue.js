"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseVue;

var _parser = require("@babel/parser");

var _vueTemplateCompiler = require("vue-template-compiler");

function parseVue(content) {
  const parsed = (0, _vueTemplateCompiler.parseComponent)(content);

  if (!parsed.script) {
    return [];
  }

  return (0, _parser.parse)(parsed.script.content, {
    sourceType: 'module',
    // Enable all known compatible @babel/parser plugins at the time of writing.
    // Because we only parse them, not evaluate any code, it is safe to do so.
    // note that babel/parser 7+ does not support *, due to plugin incompatibilities
    // Because the guys using React always want the newest syntax.
    plugins: ['asyncGenerators', 'bigInt', 'classProperties', 'classPrivateProperties', 'classPrivateMethods', ['decorators', {
      decoratorsBeforeExport: true
    }], // not decorators-legacy
    'doExpressions', 'dynamicImport', 'exportDefaultFrom', 'exportNamespaceFrom', 'functionBind', 'functionSent', 'importMeta', 'logicalAssignment', 'nullishCoalescingOperator', 'numericSeparator', 'objectRestSpread', 'optionalCatchBinding', 'optionalChaining', ['pipelineOperator', {
      proposal: 'minimal'
    }], 'throwExpressions', // and finally, jsx
    'jsx']
  });
}

module.exports = exports.default;