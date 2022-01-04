import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBridgechainPorts, IBridgechainUpdateAsset } from "../interfaces";
import { portsSchema, seedNodesSchema } from "./utils/bridgechain-schemas";

const { schemas } = Transactions;

export class BridgechainUpdateTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type = MagistrateTransactionType.BridgechainUpdate;
    public static key: string = "bridgechainUpdate";
    public static version: number = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(MagistrateTransactionStaticFees.BridgechainUpdate);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainUpdate",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: MagistrateTransactionType.BridgechainUpdate },
                typeGroup: { const: MagistrateTransactionGroup },
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
                                seedNodes: seedNodesSchema,
                                ports: portsSchema,
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

    public serialize(): Utils.ByteBuffer {
        const { data } = this;

        AppUtils.assert.defined<IBridgechainUpdateAsset>(data.asset?.bridgechainUpdate);

        const bridgechainUpdateAsset: IBridgechainUpdateAsset = data.asset.bridgechainUpdate;

        const seedNodesBuffers: Buffer[] = [];
        const seedNodes: string[] | undefined = bridgechainUpdateAsset.seedNodes;

        let seedNodesBuffersLength: number = 1;

        if (seedNodes) {
            for (const seed of seedNodes) {
                const seedBuffer: Buffer = Buffer.from(seed, "utf8");
                seedNodesBuffersLength += seedBuffer.length;
                seedNodesBuffers.push(seedBuffer);
            }
        }

        seedNodesBuffersLength += seedNodesBuffers.length;

        const ports: IBridgechainPorts | undefined = bridgechainUpdateAsset.ports;
        let portsLength: number = 0;

        const portNamesBuffers: Buffer[] = [];
        const portNumbers: number[] = [];

        let portsBuffersLength: number = 1;

        if (ports) {
            portsLength = Object.keys(ports).length;

            for (const [name, port] of Object.entries(ports)) {
                const nameBuffer: Buffer = Buffer.from(name, "utf8");
                portNamesBuffers.push(nameBuffer);
                portNumbers.push(port);
                portsBuffersLength += nameBuffer.length + 2;
            }

            portsBuffersLength += portsLength;
        }

        let bridgechainRepositoryBufferLength = 1;
        let bridgechainRepositoryBuffer: Buffer | undefined = undefined;
        const bridgechainRepository = bridgechainUpdateAsset.bridgechainRepository;
        if (bridgechainRepository) {
            bridgechainRepositoryBuffer = Buffer.from(bridgechainRepository, "utf8");
            bridgechainRepositoryBufferLength += bridgechainRepositoryBuffer.length;
        }

        let bridgechainAssetRepositoryBufferLength = 1;
        let bridgechainAssetRepositoryBuffer: Buffer | undefined = undefined;
        const bridgechainAssetRepository = bridgechainUpdateAsset.bridgechainAssetRepository;
        if (bridgechainAssetRepository) {
            bridgechainAssetRepositoryBuffer = Buffer.from(bridgechainAssetRepository, "utf8");
            bridgechainAssetRepositoryBufferLength += bridgechainAssetRepositoryBuffer.length;
        }

        const buffer = new Utils.ByteBuffer(
            Buffer.alloc(
                32 + // bridgechain id
                    seedNodesBuffersLength +
                    portsBuffersLength +
                    bridgechainRepositoryBufferLength +
                    bridgechainAssetRepositoryBufferLength,
            ),
        );

        buffer.writeBuffer(Buffer.from(bridgechainUpdateAsset.bridgechainId, "hex"));

        buffer.writeUInt8(seedNodesBuffers.length);
        for (const seedBuf of seedNodesBuffers) {
            buffer.writeUInt8(seedBuf.length);
            buffer.writeBuffer(seedBuf);
        }

        buffer.writeUInt8(portsLength);
        for (const [i, nameBuffer] of portNamesBuffers.entries()) {
            buffer.writeUInt8(nameBuffer.length);
            buffer.writeBuffer(nameBuffer);
            buffer.writeUInt16LE(portNumbers[i]);
        }

        if (bridgechainRepositoryBuffer) {
            buffer.writeUInt8(bridgechainRepositoryBuffer.length);
            buffer.writeBuffer(bridgechainRepositoryBuffer);
        } else {
            buffer.writeUInt8(0);
        }

        if (bridgechainAssetRepositoryBuffer) {
            buffer.writeUInt8(bridgechainAssetRepositoryBuffer.length);
            buffer.writeBuffer(bridgechainAssetRepositoryBuffer);
        } else {
            buffer.writeUInt8(0);
        }

        return buffer;
    }

    public deserialize(buf: Utils.ByteBuffer): void {
        const { data } = this;
        const bridgechainId: string = buf.readBuffer(32).toString("hex");

        const bridgechainUpdate: IBridgechainUpdateAsset = {
            bridgechainId,
        };

        const seedNodesLength: number = buf.readUInt8();
        if (seedNodesLength) {
            const seedNodes: string[] = [];

            for (let i = 0; i < seedNodesLength; i++) {
                const ipLength = buf.readUInt8();
                const ip = buf.readBuffer(ipLength).toString("utf8");
                seedNodes.push(ip);
            }

            bridgechainUpdate.seedNodes = seedNodes;
        }

        const portsLength: number = buf.readUInt8();
        if (portsLength) {
            const ports: IBridgechainPorts = {};

            for (let i = 0; i < portsLength; i++) {
                const nameLength: number = buf.readUInt8();
                const name: string = buf.readBuffer(nameLength).toString("utf8");
                ports[name] = buf.readUInt16LE();
            }

            bridgechainUpdate.ports = ports;
        }

        const bridgechainRepositoryLength: number = buf.readUInt8();
        if (bridgechainRepositoryLength) {
            bridgechainUpdate.bridgechainRepository = buf.readBuffer(bridgechainRepositoryLength).toString("utf8");
        }

        const bridgechainAssetRepositoryLength: number = buf.readUInt8();
        if (bridgechainAssetRepositoryLength) {
            bridgechainUpdate.bridgechainAssetRepository = buf
                .readBuffer(bridgechainAssetRepositoryLength)
                .toString("utf8");
        }

        data.asset = {
            bridgechainUpdate,
        };
    }
}
