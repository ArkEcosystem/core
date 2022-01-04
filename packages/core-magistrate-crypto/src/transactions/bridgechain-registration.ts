import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBridgechainPorts, IBridgechainRegistrationAsset } from "../interfaces";
import { portsSchema, seedNodesSchema } from "./utils/bridgechain-schemas";

const { schemas } = Transactions;

export class BridgechainRegistrationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type: number = MagistrateTransactionType.BridgechainRegistration;
    public static key: string = "bridgechainRegistration";
    public static version: number = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(MagistrateTransactionStaticFees.BridgechainRegistration);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainRegistration",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: MagistrateTransactionType.BridgechainRegistration },
                typeGroup: { const: MagistrateTransactionGroup },
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
                                seedNodes: seedNodesSchema,
                                genesisHash: {
                                    $ref: "transactionId",
                                },
                                bridgechainRepository: {
                                    $ref: "uri",
                                },
                                bridgechainAssetRepository: {
                                    $ref: "uri",
                                },
                                ports: portsSchema,
                            },
                        },
                    },
                },
            },
        });
    }

    public serialize(): Utils.ByteBuffer {
        const { data } = this;

        AppUtils.assert.defined<IBridgechainRegistrationAsset>(data.asset?.bridgechainRegistration);

        const bridgechainRegistrationAsset: IBridgechainRegistrationAsset = data.asset.bridgechainRegistration;
        const seedNodes: string[] = bridgechainRegistrationAsset.seedNodes;
        const seedNodesBuffers: Buffer[] = [];
        const bridgechainNameBuffer: Buffer = Buffer.from(bridgechainRegistrationAsset.name, "utf8");
        const bridgechainNameBufferLength: number = bridgechainNameBuffer.length;

        let seedNodesBuffersLength: number = 1;

        for (const seed of seedNodes) {
            const seedBuffer: Buffer = Buffer.from(seed, "utf8");
            seedNodesBuffersLength += seedBuffer.length;
            seedNodesBuffers.push(seedBuffer);
        }

        seedNodesBuffersLength += seedNodesBuffers.length;

        const bridgechainGenesisHash: Buffer = Buffer.from(bridgechainRegistrationAsset.genesisHash, "hex");
        const bridgechainRepositoryBuffer: Buffer = Buffer.from(
            bridgechainRegistrationAsset.bridgechainRepository,
            "utf8",
        );
        const bridgechainRepositoryBufferLength: number = bridgechainRepositoryBuffer.length;

        let bridgechainAssetRepositoryBufferLength = 1;
        let bridgechainAssetRepositoryBuffer: Buffer | undefined = undefined;
        if (bridgechainRegistrationAsset.bridgechainAssetRepository) {
            bridgechainAssetRepositoryBuffer = Buffer.from(
                bridgechainRegistrationAsset.bridgechainAssetRepository,
                "utf8",
            );
            bridgechainAssetRepositoryBufferLength += bridgechainAssetRepositoryBuffer.length;
        }

        const ports: IBridgechainPorts = bridgechainRegistrationAsset.ports;
        const portsLength: number = Object.keys(ports).length;

        const portNamesBuffers: Buffer[] = [];
        const portNumbers: number[] = [];

        let portsBuffersLength: number = 1;

        for (const [name, port] of Object.entries(ports)) {
            const nameBuffer: Buffer = Buffer.from(name, "utf8");
            portNamesBuffers.push(nameBuffer);
            portNumbers.push(port);
            portsBuffersLength += nameBuffer.length + 2;
        }

        portsBuffersLength += portsLength;

        const buffer = new Utils.ByteBuffer(
            Buffer.alloc(
                1 +
                    bridgechainNameBufferLength +
                    seedNodesBuffersLength +
                    bridgechainGenesisHash.length +
                    1 +
                    bridgechainRepositoryBufferLength +
                    bridgechainAssetRepositoryBufferLength +
                    portsBuffersLength,
            ),
        );

        buffer.writeUInt8(bridgechainNameBufferLength);
        buffer.writeBuffer(bridgechainNameBuffer);

        buffer.writeUInt8(seedNodesBuffers.length);
        for (const seedBuffer of seedNodesBuffers) {
            buffer.writeUInt8(seedBuffer.length);
            buffer.writeBuffer(seedBuffer);
        }

        buffer.writeBuffer(bridgechainGenesisHash);

        buffer.writeUInt8(bridgechainRepositoryBufferLength);
        buffer.writeBuffer(bridgechainRepositoryBuffer);

        if (bridgechainAssetRepositoryBuffer) {
            buffer.writeUInt8(bridgechainAssetRepositoryBuffer.length);
            buffer.writeBuffer(bridgechainAssetRepositoryBuffer);
        } else {
            buffer.writeUInt8(0);
        }

        buffer.writeUInt8(portsLength);
        for (const [i, nameBuffer] of portNamesBuffers.entries()) {
            buffer.writeUInt8(nameBuffer.length);
            buffer.writeBuffer(nameBuffer);
            buffer.writeUInt16LE(portNumbers[i]);
        }

        return buffer;
    }

    public deserialize(buf: Utils.ByteBuffer): void {
        const { data } = this;
        const seedNodes: string[] = [];

        const nameLength: number = buf.readUInt8();
        const name: string = buf.readBuffer(nameLength).toString("utf8");

        const seedNodesLength: number = buf.readUInt8();
        for (let i = 0; i < seedNodesLength; i++) {
            const ipLength: number = buf.readUInt8();
            const ip: string = buf.readBuffer(ipLength).toString("utf8");
            seedNodes.push(ip);
        }

        const genesisHash: string = buf.readBuffer(32).toString("hex");
        const repositoryLength: number = buf.readUInt8();
        const bridgechainRepository: string = buf.readBuffer(repositoryLength).toString("utf8");

        let bridgechainAssetRepository: string | undefined = undefined;
        const bridgechainAssetRepositoryLength: number = buf.readUInt8();
        if (bridgechainAssetRepositoryLength) {
            bridgechainAssetRepository = buf.readBuffer(bridgechainAssetRepositoryLength).toString("utf8");
        }

        const ports: IBridgechainPorts = {};

        const portsLength: number = buf.readUInt8();
        for (let i = 0; i < portsLength; i++) {
            const nameLength: number = buf.readUInt8();
            const name: string = buf.readBuffer(nameLength).toString("utf8");
            ports[name] = buf.readUInt16LE();
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
