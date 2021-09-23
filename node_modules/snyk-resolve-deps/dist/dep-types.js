"use strict";
// TODO(kyegupov): add a return type for this function
// Dependency types.
// We don't call out all of them, only the ones relevant to our behavior.
// extraneous means not found in package.json files, prod means not dev ATM
function depTypes(depName, pkg) {
    let type = null;
    let from = 'unknown';
    if (pkg.devDependencies && pkg.devDependencies[depName]) {
        type = depTypes.DEV;
        from = pkg.devDependencies[depName];
    }
    if (pkg.optionalDependencies && pkg.optionalDependencies[depName]) {
        type = depTypes.OPTIONAL;
        from = pkg.optionalDependencies[depName];
    }
    // production deps trump all
    if (pkg.dependencies && pkg.dependencies[depName]) {
        type = depTypes.PROD;
        from = pkg.dependencies[depName];
    }
    let bundled = !!(pkg.bundleDependencies &&
        pkg.bundleDependencies[depName]);
    return {
        type: type,
        from: from,
        bundled: bundled,
    };
}
depTypes.EXTRANEOUS = 'extraneous';
depTypes.OPTIONAL = 'optional';
depTypes.PROD = 'prod';
depTypes.DEV = 'dev';
module.exports = depTypes;
//# sourceMappingURL=dep-types.js.map