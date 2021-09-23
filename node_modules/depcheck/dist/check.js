"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = check;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _walkdir = _interopRequireDefault(require("walkdir"));

var _minimatch = _interopRequireDefault(require("minimatch"));

var _builtinModules = _interopRequireDefault(require("builtin-modules"));

var _requirePackageName = _interopRequireDefault(require("require-package-name"));

var _utils = require("./utils");

var _parser = _interopRequireDefault(require("./utils/parser"));

var _typescript = require("./utils/typescript");

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function isModule(dir) {
  try {
    (0, _utils.readJSON)(_path.default.resolve(dir, 'package.json'));
    return true;
  } catch (error) {
    return false;
  }
}

function mergeBuckets(object1, object2) {
  return _lodash.default.mergeWith(object1, object2, (value1, value2) => {
    const array1 = value1 || [];
    const array2 = value2 || [];
    return array1.concat(array2);
  });
}

function detect(detectors, node) {
  return (0, _lodash.default)(detectors).map(detector => {
    try {
      return detector(node);
    } catch (error) {
      return [];
    }
  }).flatten().value();
}

function discoverPropertyDep(rootDir, deps, property, depName) {
  try {
    const file = _path.default.resolve(rootDir, 'node_modules', depName, 'package.json');

    const metadata = (0, _utils.readJSON)(file);
    const propertyDeps = Object.keys(metadata[property] || {});
    return _lodash.default.intersection(deps, propertyDeps);
  } catch (error) {
    return [];
  }
}

function getDependencies(dir, filename, deps, parser, detectors) {
  return new Promise((resolve, reject) => {
    _fs.default.readFile(filename, 'utf8', (error, content) => {
      if (error) {
        reject(error);
      }

      try {
        resolve(parser(content, filename, deps, dir));
      } catch (syntaxError) {
        reject(syntaxError);
      }
    });
  }).then(ast => {
    // when parser returns string array, skip detector step and treat them as dependencies.
    const dependencies = _lodash.default.isArray(ast) && ast.every(_lodash.default.isString) ? ast : (0, _lodash.default)((0, _parser.default)(ast)).map(node => detect(detectors, node)).flatten().uniq().map(_requirePackageName.default).thru(_dependencies => parser === _constants.availableParsers.typescript // If this is a typescript file, importing foo would also use @types/foo, but
    // only if @types/foo is already a specified dependency.
    ? (0, _lodash.default)(_dependencies).map(dependency => {
      const atTypesName = (0, _typescript.getAtTypesName)(dependency);
      return deps.includes(atTypesName) ? [dependency, atTypesName] : [dependency];
    }).flatten().value() : _dependencies).value();

    const discover = _lodash.default.partial(discoverPropertyDep, dir, deps);

    const discoverPeerDeps = _lodash.default.partial(discover, 'peerDependencies');

    const discoverOptionalDeps = _lodash.default.partial(discover, 'optionalDependencies');

    const peerDeps = (0, _lodash.default)(dependencies).map(discoverPeerDeps).flatten().value();
    const optionalDeps = (0, _lodash.default)(dependencies).map(discoverOptionalDeps).flatten().value();
    return dependencies.concat(peerDeps).concat(optionalDeps);
  });
}

function checkFile(dir, filename, deps, parsers, detectors) {
  const basename = _path.default.basename(filename);

  const targets = (0, _lodash.default)(parsers).keys().filter(glob => (0, _minimatch.default)(basename, glob, {
    dot: true
  })).map(key => parsers[key]).flatten().value();
  return targets.map(parser => getDependencies(dir, filename, deps, parser, detectors).then(using => ({
    using: {
      [filename]: (0, _lodash.default)(using).filter(dep => dep && dep !== '.' && dep !== '..') // TODO why need check?
      .filter(dep => !_lodash.default.includes(_builtinModules.default, dep)).uniq().value()
    }
  }), error => ({
    invalidFiles: {
      [filename]: error
    }
  })));
}

function checkDirectory(dir, rootDir, ignoreDirs, deps, parsers, detectors) {
  return new Promise(resolve => {
    const promises = [];
    const finder = (0, _walkdir.default)(dir, {
      no_recurse: true,
      follow_symlinks: true
    });
    finder.on('directory', subdir => ignoreDirs.indexOf(_path.default.basename(subdir)) === -1 && !isModule(subdir) ? promises.push(checkDirectory(subdir, rootDir, ignoreDirs, deps, parsers, detectors)) : null);
    finder.on('file', filename => promises.push(...checkFile(rootDir, filename, deps, parsers, detectors)));
    finder.on('error', (_, error) => promises.push(Promise.resolve({
      invalidDirs: {
        [error.path]: error
      }
    })));
    finder.on('end', () => resolve(Promise.all(promises).then(results => results.reduce((obj, current) => ({
      using: mergeBuckets(obj.using, current.using || {}),
      invalidFiles: _extends(obj.invalidFiles, current.invalidFiles),
      invalidDirs: _extends(obj.invalidDirs, current.invalidDirs)
    }), {
      using: {},
      invalidFiles: {},
      invalidDirs: {}
    }))));
  });
}

function buildResult(result, deps, devDeps, peerDeps, optionalDeps, skipMissing) {
  const usingDepsLookup = (0, _lodash.default)(result.using) // { f1:[d1,d2,d3], f2:[d2,d3,d4] }
  .toPairs() // [ [f1,[d1,d2,d3]], [f2,[d2,d3,d4]] ]
  .map(([file, dep]) => [dep, _lodash.default.times(dep.length, () => file)]) // [ [ [d1,d2,d3],[f1,f1,f1] ], [ [d2,d3,d4],[f2,f2,f2] ] ]
  .map(pairs => _lodash.default.zip(...pairs)) // [ [ [d1,f1],[d2,f1],[d3,f1] ], [ [d2,f2],[d3,f2],[d4,f2]] ]
  .flatten() // [ [d1,f1], [d2,f1], [d3,f1], [d2,f2], [d3,f2], [d4,f2] ]
  .groupBy(([dep]) => dep) // { d1:[ [d1,f1] ], d2:[ [d2,f1],[d2,f2] ], d3:[ [d3,f1],[d3,f2] ], d4:[ [d4,f2] ] }
  .mapValues(pairs => pairs.map(_lodash.default.last)) // { d1:[ f1 ], d2:[ f1,f2 ], d3:[ f1,f2 ], d4:[ f2 ] }
  .value();
  const usingDeps = Object.keys(usingDepsLookup);
  const allDeps = deps.concat(devDeps).concat(peerDeps).concat(optionalDeps);

  const missingDeps = _lodash.default.difference(usingDeps, allDeps);

  const missingDepsLookup = skipMissing ? [] : (0, _lodash.default)(missingDeps).map(missingDep => [missingDep, usingDepsLookup[missingDep]]).fromPairs().value();
  return {
    dependencies: _lodash.default.difference(deps, usingDeps),
    devDependencies: _lodash.default.difference(devDeps, usingDeps),
    missing: missingDepsLookup,
    using: usingDepsLookup,
    invalidFiles: result.invalidFiles,
    invalidDirs: result.invalidDirs
  };
}

function check({
  rootDir,
  ignoreDirs,
  skipMissing,
  deps,
  devDeps,
  peerDeps,
  optionalDeps,
  parsers,
  detectors
}) {
  const allDeps = _lodash.default.union(deps, devDeps);

  return checkDirectory(rootDir, rootDir, ignoreDirs, allDeps, parsers, detectors).then(result => buildResult(result, deps, devDeps, peerDeps, optionalDeps, skipMissing));
}

module.exports = exports.default;