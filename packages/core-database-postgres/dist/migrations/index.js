"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const utils_1 = require("../utils");
exports.migrations = fs_1.readdirSync(__dirname)
    .filter(name => name.substr(-4).toLowerCase() === '.sql')
    .sort()
    .map(name => utils_1.loadQueryFile(__dirname, name));
//# sourceMappingURL=index.js.map