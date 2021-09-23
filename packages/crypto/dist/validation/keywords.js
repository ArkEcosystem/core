"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_keywords_1 = __importDefault(require("ajv-keywords"));
const enums_1 = require("../enums");
const managers_1 = require("../managers");
const utils_1 = require("../utils");
const maxBytes = (ajv) => {
    ajv.addKeyword("maxBytes", {
        type: "string",
        compile(schema, parentSchema) {
            return data => {
                if (parentSchema.type !== "string") {
                    return false;
                }
                return Buffer.from(data, "utf8").byteLength <= schema;
            };
        },
        errors: false,
        metaSchema: {
            type: "integer",
            minimum: 0,
        },
    });
};
const transactionType = (ajv) => {
    ajv.addKeyword("transactionType", {
        compile(schema) {
            return (data, dataPath, parentObject) => {
                // Impose dynamic multipayment limit based on milestone
                if (data === enums_1.TransactionType.MultiPayment &&
                    parentObject &&
                    (!parentObject.typeGroup || parentObject.typeGroup === 1)) {
                    if (parentObject.asset && parentObject.asset.payments) {
                        const limit = managers_1.configManager.getMilestone().multiPaymentLimit || 500;
                        return parentObject.asset.payments.length <= limit;
                    }
                }
                return data === schema;
            };
        },
        errors: false,
        metaSchema: {
            type: "integer",
            minimum: 0,
        },
    });
};
const network = (ajv) => {
    ajv.addKeyword("network", {
        compile(schema) {
            return data => {
                return schema && data === managers_1.configManager.get("network.pubKeyHash");
            };
        },
        errors: false,
        metaSchema: {
            type: "boolean",
        },
    });
};
const bignumber = (ajv) => {
    const instanceOf = ajv_keywords_1.default.get("instanceof").definition;
    instanceOf.CONSTRUCTORS.BigNumber = utils_1.BigNumber;
    ajv.addKeyword("bignumber", {
        compile(schema) {
            return (data, dataPath, parentObject, property) => {
                const minimum = typeof schema.minimum !== "undefined" ? schema.minimum : 0;
                const maximum = typeof schema.maximum !== "undefined" ? schema.maximum : "9223372036854775807"; // 8 byte maximum
                if (data !== 0 && !data) {
                    return false;
                }
                let bignum;
                try {
                    bignum = utils_1.BigNumber.make(data);
                }
                catch (_a) {
                    return false;
                }
                if (parentObject && property) {
                    parentObject[property] = bignum;
                }
                let bypassGenesis = false;
                if (schema.bypassGenesis) {
                    if (parentObject.id) {
                        if (schema.block) {
                            bypassGenesis = parentObject.height === 1;
                        }
                        else {
                            bypassGenesis = utils_1.isGenesisTransaction(parentObject.id);
                        }
                    }
                }
                if (bignum.isLessThan(minimum) && !(bignum.isZero() && bypassGenesis)) {
                    return false;
                }
                if (bignum.isGreaterThan(maximum) && !bypassGenesis) {
                    return false;
                }
                return true;
            };
        },
        errors: false,
        modifying: true,
        metaSchema: {
            type: "object",
            properties: {
                minimum: { type: "integer" },
                maximum: { type: "integer" },
                bypassGenesis: { type: "boolean" },
                block: { type: "boolean" },
            },
            additionalItems: false,
        },
    });
};
const blockId = (ajv) => {
    ajv.addKeyword("blockId", {
        compile(schema) {
            return (data, dataPath, parentObject) => {
                if (parentObject && parentObject.height === 1 && schema.allowNullWhenGenesis) {
                    return !data || Number(data) === 0;
                }
                if (typeof data !== "string") {
                    return false;
                }
                // Partial SHA256 block id (old/legacy), before the switch to full SHA256.
                // 8 byte integer either decimal without leading zeros or hex with leading zeros.
                const isPartial = /^[0-9]{1,20}$/.test(data) || /^[0-9a-f]{16}$/i.test(data);
                const isFullSha256 = /^[0-9a-f]{64}$/i.test(data);
                if (parentObject && parentObject.height) {
                    const height = schema.isPreviousBlock ? parentObject.height - 1 : parentObject.height;
                    const constants = managers_1.configManager.getMilestone(height);
                    return constants.block.idFullSha256 ? isFullSha256 : isPartial;
                }
                return isPartial || isFullSha256;
            };
        },
        errors: false,
        metaSchema: {
            type: "object",
            properties: {
                allowNullWhenGenesis: { type: "boolean" },
                isPreviousBlock: { type: "boolean" },
            },
            additionalItems: false,
        },
    });
};
exports.keywords = [bignumber, blockId, maxBytes, network, transactionType];
//# sourceMappingURL=keywords.js.map