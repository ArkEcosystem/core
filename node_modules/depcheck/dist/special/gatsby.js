"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseGatsbyConfig;

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _es = _interopRequireDefault(require("../parser/es7"));

var _parser = _interopRequireDefault(require("../utils/parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseConfigModuleExports(node) {
  // node.left must be assigning to module.exports
  if (node && node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && node.left.object && node.left.object.type === 'Identifier' && node.left.object.name === 'module' && node.left.property && node.left.property.type === 'Identifier' && node.left.property.name === 'exports') {
    const config = {};
    node.right.properties.forEach(prop => {
      if (prop.value.type === 'ArrayExpression' && prop.key.name === 'plugins') {
        const vals = [];
        prop.value.elements.filter(e => e.type === 'StringLiteral').forEach(e => vals.push(e.value));
        config[prop.key.name] = vals;
      }
    });
    return config;
  }

  return null;
}

function parseConfig(content) {
  const ast = (0, _es.default)(content);
  return (0, _lodash.default)((0, _parser.default)(ast)).map(node => parseConfigModuleExports(node)).flatten().filter(val => val != null).uniq().first();
}

function loadConfig(filename, content) {
  const basename = _path.default.basename(filename);

  const GatbyConfig = 'gatsby-config.js';

  if (GatbyConfig === basename) {
    const config = parseConfig(content);
    return config.plugins || [];
  }

  return [];
}

function parseGatsbyConfig(content, filename) {
  return loadConfig(filename, content);
}

module.exports = exports.default;