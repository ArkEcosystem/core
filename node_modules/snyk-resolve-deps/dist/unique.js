"use strict";
const walk = require("./walk");
function unique(deps) {
    let res = copy(deps);
    res.dependencies = {};
    walk(deps, function (dep) {
        let shallowCopy = copy(dep);
        res.dependencies[dep.name + '@' + dep.version] = shallowCopy;
    });
    return res;
}
// TODO: rename to withoutDeps, don't use reduce
function copy(dep) {
    return Object.keys(dep).filter(function (key) {
        return key.toLowerCase().indexOf('dependencies') === -1;
    }).reduce(function (acc, curr) {
        acc[curr] = dep[curr];
        return acc;
    }, {});
}
module.exports = unique;
//# sourceMappingURL=unique.js.map