"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const ipAddress = __importStar(require("ip"));
exports.registerFormats = (ajv) => {
    const config = core_container_1.app.getConfig();
    ajv.addFormat("address", {
        type: "string",
        validate: value => {
            try {
                return crypto_1.Utils.Base58.decodeCheck(value)[0] === config.get("network.pubKeyHash");
            }
            catch (e) {
                return false;
            }
        },
    });
    ajv.addFormat("csv", {
        type: "string",
        validate: value => {
            try {
                const a = value.split(",");
                return a.length > 0 && a.length <= 1000;
            }
            catch (e) {
                return false;
            }
        },
    });
    ajv.addFormat("hex", {
        type: "string",
        validate: value => value.match(/^[0-9a-f]+$/i) !== null && value.length % 2 === 0,
    });
    ajv.addFormat("ip", {
        type: "string",
        validate: value => ipAddress.isV4Format(value) || ipAddress.isV6Format(value),
    });
    ajv.addFormat("parsedInt", {
        type: "string",
        validate: (value) => {
            if (isNaN(value) || parseInt(value, 10) !== value || isNaN(parseInt(value, 10))) {
                return false;
            }
            value = parseInt(value, 10);
            return true;
        },
    });
    ajv.addFormat("publicKey", {
        type: "string",
        validate: value => {
            try {
                return Buffer.from(value, "hex").length === 33;
            }
            catch (e) {
                return false;
            }
        },
    });
    ajv.addFormat("signature", {
        type: "string",
        validate: value => {
            try {
                return Buffer.from(value, "hex").length < 73;
            }
            catch (e) {
                return false;
            }
        },
    });
};
//# sourceMappingURL=formats.js.map