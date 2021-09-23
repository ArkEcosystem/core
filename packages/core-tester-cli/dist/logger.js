"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
exports.logger = pino_1.default({
    name: "core-tester-cli",
    safe: true,
    prettyPrint: true,
});
//# sourceMappingURL=logger.js.map