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
class BridgechainRegistrationTransaction extends crypto_1.Transactions.Transaction {
    static getSchema() {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainRegistration",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: enums_1.MagistrateTransactionType.BridgechainRegistration },
                typeGroup: { const: enums_1.MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["bridgechainRegistration"],
                    additionalProperties: false,
                    properties: {
                        bridgechainRegistration: {
                            type: "object",
                            required: ["name", "seedNodes", "genesisHash", "bridgechainRepository", "ports"],
                            additionalProperties: false,
                            properties: {
                                name: {
                                    $ref: "genericName",
                                },
                                seedNodes: bridgechain_schemas_1.seedNodesSchema,
                                genesisHash: {
                                    $ref: "transactionId",
                                },
                                bridgechainRepository: {
                                    $ref: "uri",
                                },
                                bridgechainAssetRepository: {
                                    $ref: "uri",
                                },
                                ports: bridgechain_schemas_1.portsSchema,
                            },
                        },
                    },
                },
            },
        });
    }
    serialize() {
        const { data } = this;
        const bridgechainRegistrationAsset = data.asset.bridgechainRegistration;
        const seedNodes = bridgechainRegistrationAsset.seedNodes;
        const seedNodesBuffers = [];
        const bridgechainNameBuffer = Buffer.from(bridgechainRegistrationAsset.name, "utf8");
        const bridgechainNameBufferLength = bridgechainNameBuffer.length;
        let seedNodesBuffersLength = 1;
        for (const seed of seedNodes) {
            const seedBuffer = Buffer.from(seed, "utf8");
            seedNodesBuffersLength += seedBuffer.length;
            seedNodesBuffers.push(seedBuffer);
        }
        seedNodesBuffersLength += seedNodesBuffers.length;
        const bridgechainGenesisHash = Buffer.from(bridgechainRegistrationAsset.genesisHash, "hex");
        const bridgechainRepositoryBuffer = Buffer.from(bridgechainRegistrationAsset.bridgechainRepository, "utf8");
        const bridgechainRepositoryBufferLength = bridgechainRepositoryBuffer.length;
        let bridgechainAssetRepositoryBufferLength = 1;
        let bridgechainAssetRepositoryBuffer;
        if (bridgechainRegistrationAsset.bridgechainAssetRepository) {
            bridgechainAssetRepositoryBuffer = Buffer.from(bridgechainRegistrationAsset.bridgechainAssetRepository, "utf8");
            bridgechainAssetRepositoryBufferLength += bridgechainAssetRepositoryBuffer.length;
        }
        const ports = bridgechainRegistrationAsset.ports;
        const portsLength = Object.keys(ports).length;
        const portNamesBuffers = [];
        const portNumbers = [];
        let portsBuffersLength = 1;
        for (const [name, port] of Object.entries(ports)) {
            const nameBuffer = Buffer.from(name, "utf8");
            portNamesBuffers.push(nameBuffer);
            portNumbers.push(port);
            portsBuffersLength += nameBuffer.length + 2;
        }
        portsBuffersLength += portsLength;
        const buffer = new bytebuffer_1.default(bridgechainNameBufferLength +
            seedNodesBuffersLength +
            bridgechainGenesisHash.length +
            bridgechainRepositoryBufferLength +
            bridgechainAssetRepositoryBufferLength +
            portsBuffersLength, true);
        buffer.writeUint8(bridgechainNameBufferLength);
        buffer.append(bridgechainNameBuffer);
        buffer.writeUint8(seedNodesBuffers.length);
        for (const seedBuffer of seedNodesBuffers) {
            buffer.writeUint8(seedBuffer.length);
            buffer.append(seedBuffer);
        }
        buffer.append(bridgechainGenesisHash);
        buffer.writeUint8(bridgechainRepositoryBufferLength);
        buffer.append(bridgechainRepositoryBuffer);
        if (bridgechainAssetRepositoryBuffer) {
            buffer.writeUint8(bridgechainAssetRepositoryBuffer.length);
            buffer.append(bridgechainAssetRepositoryBuffer);
        }
        else {
            buffer.writeUint8(0);
        }
        buffer.writeUint8(portsLength);
        for (const [i, nameBuffer] of portNamesBuffers.entries()) {
            buffer.writeUint8(nameBuffer.length);
            buffer.append(nameBuffer);
            buffer.writeUint16(portNumbers[i]);
        }
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        const seedNodes = [];
        const nameLength = buf.readUint8();
        const name = buf.readString(nameLength);
        const seedNodesLength = buf.readUint8();
        for (let i = 0; i < seedNodesLength; i++) {
            const ipLength = buf.readUint8();
            const ip = buf.readString(ipLength);
            seedNodes.push(ip);
        }
        const genesisHash = buf.readBytes(32).toString("hex");
        const repositoryLength = buf.readUint8();
        const bridgechainRepository = buf.readString(repositoryLength);
        let bridgechainAssetRepository;
        const bridgechainAssetRepositoryLength = buf.readUint8();
        if (bridgechainAssetRepositoryLength) {
            bridgechainAssetRepository = buf.readString(bridgechainAssetRepositoryLength);
        }
        const ports = {};
        const portsLength = buf.readUint8();
        for (let i = 0; i < portsLength; i++) {
            const nameLength = buf.readUint8();
            const name = buf.readString(nameLength);
            const port = buf.readUint16();
            ports[name] = port;
        }
        data.asset = {
            bridgechainRegistration: {
                name,
                seedNodes,
                genesisHash,
                bridgechainRepository,
                ports,
            },
        };
        if (bridgechainAssetRepository) {
            data.asset.bridgechainRegistration.bridgechainAssetRepository = bridgechainAssetRepository;
        }
    }
}
exports.BridgechainRegistrationTransaction = BridgechainRegistrationTransaction;
BridgechainRegistrationTransaction.typeGroup = enums_1.MagistrateTransactionGroup;
BridgechainRegistrationTransaction.type = enums_1.MagistrateTransactionType.BridgechainRegistration;
BridgechainRegistrationTransaction.key = "bridgechainRegistration";
BridgechainRegistrationTransaction.defaultStaticFee = crypto_1.Utils.BigNumber.make(enums_1.MagistrateTransactionStaticFees.BridgechainRegistration);
//# sourceMappingURL=bridgechain-registration.js.map