"use strict";
const physicalTree = require("./deps");
const logicalTree = require("./logical");
const walk = require("./walk");
const prune = require("./prune");
const pluck = require("./pluck");
const unique = require("./unique");
function resolveDeps(dir, options) {
    return physicalTree(dir, null, options).then((res) => logicalTree(res, options));
}
resolveDeps.physicalTree = physicalTree;
resolveDeps.logicalTree = logicalTree;
resolveDeps.walk = walk;
resolveDeps.prune = prune;
resolveDeps.pluck = pluck;
resolveDeps.unique = unique;
module.exports = resolveDeps;
//# sourceMappingURL=index.js.map