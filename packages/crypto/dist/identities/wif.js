"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wif_1 = __importDefault(require("wif"));
const managers_1 = require("../managers");
const keys_1 = require("./keys");
class WIF {
    static fromPassphrase(passphrase, network) {
        const keys = keys_1.Keys.fromPassphrase(passphrase);
        if (!network) {
            network = managers_1.configManager.get("network");
        }
        return wif_1.default.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }
    static fromKeys(keys, network) {
        if (!network) {
            network = managers_1.configManager.get("network");
        }
        return wif_1.default.encode(network.wif, Buffer.from(keys.privateKey, "hex"), keys.compressed);
    }
}
exports.WIF = WIF;
//# sourceMappingURL=wif.js.map