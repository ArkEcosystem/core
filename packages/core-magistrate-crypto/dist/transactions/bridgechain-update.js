"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const enums_1 = require("../enums");
const bridgechain_schemas_1 = require("./utils/bridgechain-schemas");
const { schemas } = crypto_1.Transactions;
class BridgechainUpdateTransaction extends crypto_1.Transactions.Transaction {
    static getSchema() {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainUpdate",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: enums_1.MagistrateTransactionType.BridgechainUpdate },
                typeGroup: { const: enums_1.MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["bridgechainUpdate"],
                    properties: {
                        bridgechainUpdate: {
                            type: "object",
                            required: ["bridgechainId"],
                            anyOf: [
                                {
                                    required: ["seedNodes"],
                                },
                                {
                                    required: ["ports"],
                                },
                                {
                                    required: ["bridgechainRepository"],
                                },
                                {
                                    required: ["bridgechainAssetRepository"],
                                },
                            ],
                            properties: {
                                bridgechainId: {
                                    $ref: "transactionId",
                                },
                                seedNodes: bridgechain_schemas_1.seedNodesSchema,
                                ports: bridgechain_schemas_1.portsSchema,
                                bridgechainRepository: {
                                    $ref: "uri",
                                },
                                bridgechainAssetRepository: {
                                    $ref: "uri",
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    serialize() {
        const { data } = this;
        const bridgechainUpdateAsset = data.asset.bridgechainUpdate;
        const seedNodesBuffers = [];
        const seedNodes = bridgechainUpdateAsset.seedNodes;
        let seedNodesBuffersLength = 1;
        if (seedNodes) {
            for (const seed of seedNodes) {
                const seedBuffer = Buffer.from(seed, "utf8");
                seedNodesBuffersLength += seedBuffer.length;
                seedNodesBuffers.push(seedBuffer);
            }
        }
        seedNodesBuffersLength += seedNodesBuffers.length;
        const ports = bridgechainUpdateAsset.ports;
        let portsLength = 0;
        const portNamesBuffers = [];
        const portNumbers = [];
        let portsBuffersLength = 1;
        if (ports) {
            portsLength = Object.keys(ports).length;
            for (const [name, port] of Object.entries(ports)) {
                const nameBuffer = Buffer.from(name, "utf8");
                portNamesBuffers.push(nameBuffer);
                portNumbers.push(port);
                portsBuffersLength += nameBuffer.length + 2;
            }
            portsBuffersLength += portsLength;
        }
        let bridgechainRepositoryBufferLength = 1;
        let bridgechainRepositoryBuffer;
        const bridgechainRepository = bridgechainUpdateAsset.bridgechainRepository;
        if (bridgechainRepository) {
            bridgechainRepositoryBuffer = Buffer.from(bridgechainRepository, "utf8");
            bridgechainRepositoryBufferLength += bridgechainRepositoryBuffer.length;
        }
        let bridgechainAssetRepositoryBufferLength = 1;
        let bridgechainAssetRepositoryBuffer;
        const bridgechainAssetRepository = bridgechainUpdateAsset.bridgechainAssetRepository;
        if (bridgechainAssetRepository) {
            bridgechainAssetRepositoryBuffer = Buffer.from(bridgechainAssetRepository, "utf8");
            bridgechainAssetRepositoryBufferLength += bridgechainAssetRepositoryBuffer.length;
        }
        const buffer = new bytebuffer_1.default(32 + // bridgechain id
            seedNodesBuffersLength +
            portsBuffersLength +
            bridgechainRepositoryBufferLength +
            bridgechainAssetRepositoryBufferLength, true);
        buffer.append(bridgechainUpdateAsset.bridgechainId, "hex");
        buffer.writeUint8(seedNodesBuffers.length);
        for (const seedBuf of seedNodesBuffers) {
            buffer.writeUint8(seedBuf.length);
            buffer.append(seedBuf);
        }
        buffer.writeUint8(portsLength);
        for (const [i, nameBuffer] of portNamesBuffers.entries()) {
            buffer.writeUint8(nameBuffer.length);
            buffer.append(nameBuffer);
            buffer.writeUint16(portNumbers[i]);
        }
        if (bridgechainRepositoryBuffer) {
            buffer.writeUint8(bridgechainRepositoryBuffer.length);
            buffer.append(bridgechainRepositoryBuffer);
        }
        else {
            buffer.writeUint8(0);
        }
        if (bridgechainAssetRepositoryBuffer) {
            buffer.writeUint8(bridgechainAssetRepositoryBuffer.length);
            buffer.append(bridgechainAssetRepositoryBuffer);
        }
        else {
            buffer.writeUint8(0);
        }
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        const bridgechainId = buf.readBytes(32).toString("hex");
        const bridgechainUpdate = {
            bridgechainId,
        };
        const seedNodesLength = buf.readUint8();
        if (seedNodesLength) {
            const seedNodes = [];
            for (let i = 0; i < seedNodesLength; i++) {
                const ipLength = buf.readUint8();
                const ip = buf.readString(ipLength);
                seedNodes.push(ip);
            }
            bridgechainUpdate.seedNodes = seedNodes;
        }
        const portsLength = buf.readUint8();
        if (portsLength) {
            const ports = {};
            for (let i = 0; i < portsLength; i++) {
                const nameLength = buf.readUint8();
                const name = buf.readString(nameLength);
                const port = buf.readUint16();
                ports[name] = port;
            }
            bridgechainUpdate.ports = ports;
        }
        const bridgechainRepositoryLength = buf.readUint8();
        if (bridgechainRepositoryLength) {
            bridgechainUpdate.bridgechainRepository = buf.readString(bridgechainRepositoryLength);
        }
        const bridgechainAssetRepositoryLength = buf.readUint8();
        if (bridgechainAssetRepositoryLength) {
            bridgechainUpdate.bridgechainAssetRepository = buf.readString(bridgechainAssetRepositoryLength);
        }
        data.asset = {
            bridgechainUpdate,
        };
    }
}
exports.BridgechainUpdateTransaction = BridgechainUpdateTransaction;
BridgechainUpdateTransaction.typeGroup = enums_1.MagistrateTransactionGroup;
BridgechainUpdateTransaction.type = enums_1.MagistrateTransactionType.BridgechainUpdate;
BridgechainUpdateTransaction.key = "bridgechainUpdate";
BridgechainUpdateTransaction.defaultStaticFee = crypto_1.Utils.BigNumber.make(enums_1.MagistrateTransactionStaticFees.BridgechainUpdate);
//# sourceMappingURL=bridgechain-update.js.map