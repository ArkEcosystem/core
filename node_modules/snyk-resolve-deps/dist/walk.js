"use strict";
function walk(depsOrPkg, filter) {
    if (!depsOrPkg) {
        return [];
    }
    let deps = (depsOrPkg.dependencies ? depsOrPkg.dependencies : depsOrPkg);
    Object.keys(deps).forEach(function (name) {
        let res = filter(deps[name], name, deps);
        if (!res && deps[name] && deps[name].dep) {
            walk(deps[name].dependencies, filter);
        }
    });
}
module.exports = walk;
//# sourceMappingURL=walk.js.map