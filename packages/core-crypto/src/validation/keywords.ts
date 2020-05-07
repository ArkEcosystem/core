import { CryptoManager, Enums, Interfaces, Types } from "@arkecosystem/crypto";
import { Ajv } from "ajv";
import ajvKeywords from "ajv-keywords";

import { IBlock } from "../interfaces";

const maxBytes = (ajv: Ajv) => {
    ajv.addKeyword("maxBytes", {
        type: "string",
        compile(schema, parentSchema) {
            return (data) => {
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

const transactionType = (ajv: Ajv, cryptoManager: CryptoManager<IBlock>) => {
    ajv.addKeyword("transactionType", {
        // @ts-ignore
        compile(schema) {
            return (data, dataPath, parentObject: Interfaces.ITransactionData) => {
                // Impose dynamic multipayment limit based on milestone
                if (
                    data === Enums.TransactionType.MultiPayment &&
                    parentObject &&
                    (!parentObject.typeGroup || parentObject.typeGroup === 1)
                ) {
                    if (parentObject.asset && parentObject.asset.payments) {
                        const limit: number = cryptoManager.MilestoneManager.getMilestone().multiPaymentLimit || 256;
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

const network = (ajv: Ajv, cryptoManager: CryptoManager<IBlock>) => {
    ajv.addKeyword("network", {
        compile(schema) {
            return (data) => {
                return schema && data === cryptoManager.NetworkConfigManager.get("network.pubKeyHash");
            };
        },
        errors: false,
        metaSchema: {
            type: "boolean",
        },
    });
};

const bignumber = (ajv: Ajv, cryptoManager: CryptoManager<IBlock>) => {
    const instanceOf = ajvKeywords.get("instanceof").definition;
    instanceOf.CONSTRUCTORS.BigNumber = Types.BigNumber;

    ajv.addKeyword("bignumber", {
        compile(schema) {
            return (data, dataPath, parentObject: any, property) => {
                const minimum = typeof schema.minimum !== "undefined" ? schema.minimum : 0;
                const maximum = typeof schema.maximum !== "undefined" ? schema.maximum : "9223372036854775807"; // 8 byte maximum

                if (data !== 0 && !data) {
                    return false;
                }

                let bignum: Types.BigNumber;
                try {
                    bignum = cryptoManager.LibraryManager.Libraries.BigNumber.make(data);
                } catch {
                    return false;
                }

                if (parentObject && property) {
                    parentObject[property] = bignum;
                }

                let bypassGenesis: boolean = false;
                if (schema.bypassGenesis) {
                    if (parentObject.id) {
                        if (schema.block) {
                            bypassGenesis = parentObject.height === 1;
                        } else {
                            bypassGenesis = cryptoManager.LibraryManager.Utils.isGenesisTransaction(parentObject.id);
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

const blockId = (ajv: Ajv, cryptoManager: CryptoManager<IBlock>) => {
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
                    const constants = cryptoManager.MilestoneManager.getMilestone(height);
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

export const keywords = [bignumber, blockId, maxBytes, network, transactionType];
