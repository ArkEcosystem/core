"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_1 = __importDefault(require("@bugsnag/js"));
const defaults_1 = require("./defaults");
exports.plugin = {
    pkg: require("../package.json"),
    defaults: defaults_1.defaults,
    alias: "error-tracker",
    async register(container, options) {
        if (!options.apiKey || typeof options.apiKey !== "string") {
            throw new Error("Bugsnag plugin config invalid");
        }
        return js_1.default(options);
    },
};
//# sourceMappingURL=index.js.map