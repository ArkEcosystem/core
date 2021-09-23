"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const raygun_1 = __importDefault(require("raygun"));
const defaults_1 = require("./defaults");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "error-tracker",
    async register(container, options) {
        return new raygun_1.default.Client().init(options);
    },
};
//# sourceMappingURL=index.js.map