"use strict";
function prune(pkg, shouldPrune) {
    let remove = shouldPrune(pkg);
    if (!remove) {
        pkg.dependencies = {};
    }
    let deps = Object.keys(pkg.dependencies || {});
    if (deps.length) {
        remove = deps.filter(function (name) {
            if (prune(pkg.dependencies[name], shouldPrune)) {
                delete pkg.dependencies[name];
                return false;
            }
            return true;
        }).length;
        remove = remove === 0;
    }
    return remove;
}
module.exports = prune;
//# sourceMappingURL=prune.js.map