"use strict";
const semver = require("semver");
const moduleToObject = require("snyk-module");
const debugModule = require("debug");
const debug = debugModule('snyk:resolve:pluck');
const parseOptions = { loose: true };
function pluck(root, path, name, range) {
    if (range === 'latest') {
        range = '*';
    }
    // Cycle through the tree path via the root tree object **ala node require**.
    // note that we don't need the first item in the path (which is the root
    // package name).
    let from = path.slice(0);
    let rootPath = moduleToObject(from.shift(), parseOptions).name;
    // if the root of the virtual tree doesn't even match our path, bail out
    if (rootPath !== root.name) {
        return false;
    }
    // do a check to see if the last item in the path is actually the package
    // we're looking for, and if it's not, push it on
    if (from.length !== 0 &&
        moduleToObject(from.slice(-1).pop(), parseOptions).name === name) {
        from.pop();
    }
    // then we always put the target package on the end of the chain
    // to ensure it's in exactly the right format to be used in `getMatch`
    from.push(name + '@' + range);
    debug('using forward search %s@%s in %s', from.join(' > '));
    let match = false;
    let leaf = root;
    let realPath = [];
    while (from.length) {
        let pkg = moduleToObject(from[0], parseOptions);
        let test = getMatch(leaf, pkg.name, pkg.version);
        if (test) {
            from.shift();
            realPath.push(leaf);
            leaf = test;
        }
        else {
            let maybeLeaf = realPath.pop();
            if (!maybeLeaf) {
                return false;
            }
            leaf = maybeLeaf;
        }
    }
    return leaf.name === name ? leaf : false;
}
function getMatch(root, name, range) {
    let dep = root.dependencies && root.dependencies[name];
    if (!dep) {
        return false;
    }
    let version = dep.version;
    debug('pluck match on name...checking version: %s ~= %s', version, range);
    // make sure it matches our range
    let semverMatch = semver.validRange(range) &&
        semver.valid(version) &&
        semver.satisfies(version, range);
    let externalPackage = !semver.validRange(range) &&
        range.indexOf(':/') !== -1;
    if (semverMatch || externalPackage) {
        debug('pluck match');
        if (!dep.dep) {
            dep.dep = range;
        }
        return dep;
    }
    return false;
}
module.exports = pluck;
//# sourceMappingURL=pluck.js.map