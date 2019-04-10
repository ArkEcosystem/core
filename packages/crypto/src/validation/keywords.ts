import { Ajv } from "ajv";
import ajvKeywords from "ajv-keywords";
import { Address } from "../identities/address";
import { configManager } from "../managers";
import { Bignum, isGenesisTransaction } from "../utils";

const maxBytes = (ajv: Ajv) => {
    ajv.addKeyword("maxBytes", {
        type: "string",
        compile(schema, parentSchema) {
            return data => {
                if ((parentSchema as any).type !== "string") {
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

const transactionType = (ajv: Ajv) => {
    ajv.addKeyword("transactionType", {
        compile(schema) {
            return data => {
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

const network = (ajv: Ajv) => {
    ajv.addKeyword("network", {
        compile(schema) {
            return data => {
                return schema && data === configManager.get("pubKeyHash");
            };
        },
        errors: false,
        metaSchema: {
            type: "boolean",
        },
    });
};

const bignumber = (ajv: Ajv) => {
    const instanceOf = ajvKeywords.get("instanceof").definition;
    instanceOf.CONSTRUCTORS.Bignum = Bignum;

    ajv.addKeyword("bignumber", {
        compile(schema) {
            return (data, dataPath, parentObject: any, property) => {
                const minimum = typeof schema.minimum !== "undefined" ? schema.minimum : 0;
                const maximum = typeof schema.maximum !== "undefined" ? schema.maximum : Number.MAX_SAFE_INTEGER;

                const bignum = new Bignum(data);

                if (!bignum.isInteger()) {
                    return false;
                }

                let bypassGenesis = false;
                if (schema.bypassGenesis) {
                    if (parentObject.id) {
                        if (schema.block) {
                            bypassGenesis = parentObject.height === 1;
                        } else {
                            bypassGenesis = isGenesisTransaction(parentObject.id);
                        }
                    }
                }

                if (bignum.isLessThan(minimum) && !(bignum.isZero() && bypassGenesis)) {
                    return false;
                }

                if (bignum.isGreaterThan(maximum) && !bypassGenesis) {
                    return false;
                }

                if (parentObject && property) {
                    parentObject[property] = bignum;
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

const blockId = (ajv: Ajv) => {
    ajv.addKeyword("blockId", {
        compile(schema) {
            return (data, dataPath, parentObject: any) => {
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
                    const constants = configManager.getMilestone(height);
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

const addressOnNetwork = (ajv: Ajv) => {
    ajv.addKeyword("addressOnNetwork", {
        compile(schema) {
            return data => {
                return schema && typeof data === "string" && Address.validate(data);
            };
        },
        errors: false,
        metaSchema: {
            type: "boolean",
        },
    });
};

export const keywords = [bignumber, blockId, maxBytes, network, transactionType, addressOnNetwork];
