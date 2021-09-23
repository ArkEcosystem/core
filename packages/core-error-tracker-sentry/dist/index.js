"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = __importDefault(require("@sentry/node"));
const defaults_1 = require("./defaults");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "error-tracker",
    async register(container, options) {
        node_1.default.init(options);
        return node_1.default;
    },
};
//# sourceMappingURL=index.js.map