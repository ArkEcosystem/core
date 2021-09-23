"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const joi_1 = __importDefault(require("@hapi/joi"));
const address_1 = require("./address");
const public_key_1 = require("./public-key");
const username_1 = require("./username");
exports.walletId = joi_1.default.alternatives().try(username_1.username, address_1.address, public_key_1.publicKey);
//# sourceMappingURL=wallet-id.js.map