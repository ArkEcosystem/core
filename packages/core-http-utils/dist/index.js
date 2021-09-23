"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugins = __importStar(require("./plugins"));
exports.plugins = plugins;
const create_1 = require("./server/create");
exports.createServer = create_1.createServer;
const monitor_1 = require("./server/monitor");
exports.monitorServer = monitor_1.monitorServer;
const mount_1 = require("./server/mount");
exports.mountServer = mount_1.mountServer;
//# sourceMappingURL=index.js.map