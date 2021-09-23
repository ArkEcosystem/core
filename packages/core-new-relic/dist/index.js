"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const newrelic_1 = __importDefault(require("newrelic"));
exports.plugin = {
    pkg: require("../package.json"),
    alias: "error-tracker",
    async register(container, options) {
        return newrelic_1.default;
    },
};
//# sourceMappingURL=index.js.map