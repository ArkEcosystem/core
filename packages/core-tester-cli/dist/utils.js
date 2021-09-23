"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clipboardy_1 = __importDefault(require("clipboardy"));
exports.copyToClipboard = data => {
    clipboardy_1.default.writeSync(JSON.stringify(data));
};
exports.handleOutput = (opts, data) => {
    if (opts.copy) {
        return exports.copyToClipboard(data);
    }
    if (opts.log) {
        return console.log(data);
    }
    return data;
};
//# sourceMappingURL=utils.js.map