"use strict";
const pluck = require("./pluck");
const walk = require("./walk");
const unique = require("./unique");
const path = require("path");
const depTypes = require("./dep-types");
const colour = require("ansicolors");
const moduleToObject = require("snyk-module");
const _ = require("./lodash");
const util = require("util");
const format = util.format;
const ext = colour.bgBlack(colour.green('extraneous'));
/**
 * This code will build up the logical tree representation of a node package
 * and it's dependencies. This is based initially on reading the directory
 * structure and the package.json files found in each directory.
 *
 * After which, we parse the tree and read the `__dependencies` looking for
 * their actual location on disk (or if it's missing, etc) - marking as we
 * go along that the leaf has been used.
 *
 * After that, we need to search for the original tree for unused leafs, and
 * these will be marked as extraneous and carried through to the logical
 * tree at the same depth.
 *
 * Important: some extraneous modules will actually be from devDependencies
 * from the root level, so we need to handle these carefully.
 */
function logicalTree(fileTree, options) {
    if (!options) {
        options = {};
    }
    let problems = [];
    let logicalRoot = copy(fileTree, fileTree.__from);
    logicalRoot.dependencies = walkDeps(fileTree, fileTree, undefined, problems);
    let removedPaths = [];
    if (!options.dev) {
        // do a shallow pass on the deps and strip out dev deps
        Object.keys(fileTree.dependencies).forEach(function (name) {
            let dep = fileTree.dependencies[name];
            // if we're not interested in devDeps, then strip them out
            if (dep.depType === depTypes.DEV) {
                // since dev deps are only ever on the root, we know we can remove it
                // directly from the logicalRoot.dependencies
                removedPaths.push(dep.__from);
                delete logicalRoot.dependencies[dep.name];
                return;
            }
        });
    }
    logicalRoot.numFileDependencies = 0;
    walk(fileTree.dependencies, function (dep) {
        logicalRoot.numFileDependencies++;
        if (!dep.__used) {
            let deppath = dep.__from.slice(0, -1).toString();
            let removed = removedPaths.filter(function (removedPath) {
                return deppath.indexOf(removedPath) === 0;
            }).length;
            if (removed) {
                return false; // this was from a dev dep, so let's lose it
            }
            let leaf = copy(dep);
            let issue = format('%s: %s@%s (from %s) > %s', ext, leaf.name, leaf.version, leaf.dep, path.relative('.', leaf.__filename));
            leaf.problems = [issue];
            problems.push(issue);
            leaf.extraneous = true;
            leaf.depType = depTypes.EXTRANEOUS;
            leaf.dependencies = walkDeps(fileTree, dep, undefined, problems);
            walk(leaf.dependencies, function (extraDep) {
                extraDep.extraneous = true;
                extraDep.depType = depTypes.EXTRANEOUS;
            });
            insertLeaf(logicalRoot, leaf, dep.__from);
        }
    });
    logicalRoot.numDependencies = Object.keys(unique(logicalRoot).dependencies).length;
    logicalRoot.pluck = pluck.bind(null, fileTree);
    logicalRoot.unique = unique.bind(null, logicalRoot);
    logicalRoot.problems = problems.slice(0);
    if (options.noFromArrays) {
        logicalRoot = removeFromPaths(logicalRoot);
    }
    return logicalRoot;
}
function insertLeaf(tree, leaf, from) {
    // remove the root of the path and covert to names only
    let leafPath = (from || []).slice(1, -1).map(function (pkg) {
        return moduleToObject(pkg).name;
    });
    let entry = tree.dependencies;
    for (let i = 0; i < leafPath.length; i++) {
        if (entry[leafPath[i]]) {
            entry = entry[leafPath[i]].dependencies;
        }
    }
    entry[leaf.name] = leaf;
}
function walkDeps(root, tree, suppliedFrom, problems) {
    let from = suppliedFrom || tree.__from;
    // only include the devDeps on the root level package
    let deps = _.extend({}, tree.__dependencies, tree.__from && from.length === 1 ? tree.__devDependencies : {});
    deps = _.extend(deps, tree.__optionalDependencies);
    return Object.keys(deps).reduce(function walkDepsPicker(acc, curr) {
        // only attempt to walk this dep if it's not in our path already
        if (tree.__from.indexOf(curr) === -1) {
            let version = deps[curr];
            let dep = pluck(root, tree.__from, curr, version);
            if (!dep) {
                problems.push(format('missing: %s@%s, required by %s', curr, version, from.join(' > ')));
                return acc;
            }
            if (from.indexOf(dep.full) === -1) {
                let pkg = acc[dep.name] = copy(dep, from.concat(dep.full));
                dep.__used = true;
                let info = depTypes(dep.name, {
                    dependencies: tree.__dependencies,
                    devDependencies: tree.__devDependencies,
                    bundleDependencies: tree.__bundleDependencies,
                    optionalDependencies: tree.__optionalDependencies,
                });
                pkg.depType = info.type;
                pkg.dep = info.from;
                if (tree.bundled) { // carry the bundled flag down from the parent
                    dep.bundled = pkg.bundled = tree.bundled;
                }
                pkg.dependencies = walkDeps(root, dep, pkg.from, problems);
            }
        }
        return acc;
    }, {});
}
function copy(leaf, from) {
    if (!from) {
        from = leaf.__from;
    }
    let res = Object.keys(leaf).reduce(function copyIterator(acc, curr) {
        if (leaf[curr] !== undefined && curr.indexOf('__') !== 0) {
            if (curr !== 'dependencies') {
                acc[curr] = leaf[curr];
            }
        }
        return acc;
    }, {});
    res.from = from.slice(0);
    res.__filename = leaf.__filename;
    return res;
}
function removeFromPaths(tree) {
    delete tree.from;
    let deps = tree.dependencies;
    Object.keys(deps).forEach(function (name) {
        removeFromPaths(deps[name]);
    });
    return tree;
}
module.exports = logicalTree;
//# sourceMappingURL=logical.js.map