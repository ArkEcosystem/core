import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBridgechainPorts, IBridgechainRegistrationAsset } from "../interfaces";
import { portsSchema, seedNodesSchema } from "./utils/bridgechain-schemas";

const { schemas } = Transactions;

export class BridgechainRegistrationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type: number = MagistrateTransactionType.BridgechainRegistration;
    public static key: string = "bridgechainRegistration";

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
    protected static defaultStaticFee = Utils.BigNumber.make(MagistrateTransactionStaticFees.BridgechainRegistration);

    public serialize(): ByteBuffer {
        const { data } = this;

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
        let bridgechainAssetRepositoryBuffer: Buffer;
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

        const buffer: ByteBuffer = new ByteBuffer(
            bridgechainNameBufferLength +
                seedNodesBuffersLength +
                bridgechainGenesisHash.length +
                bridgechainRepositoryBufferLength +
                bridgechainAssetRepositoryBufferLength +
                portsBuffersLength,
            true,
        );

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
        } else {
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

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const seedNodes: string[] = [];

        const nameLength: number = buf.readUint8();
        const name: string = buf.readString(nameLength);

        const seedNodesLength: number = buf.readUint8();
        for (let i = 0; i < seedNodesLength; i++) {
            const ipLength: number = buf.readUint8();
            const ip: string = buf.readString(ipLength);
            seedNodes.push(ip);
        }

        const genesisHash: string = buf.readBytes(32).toString("hex");
        const repositoryLength: number = buf.readUint8();
        const bridgechainRepository: string = buf.readString(repositoryLength);

        let bridgechainAssetRepository: string;
        const bridgechainAssetRepositoryLength: number = buf.readUint8();
        if (bridgechainAssetRepositoryLength) {
            bridgechainAssetRepository = buf.readString(bridgechainAssetRepositoryLength);
        }

        const ports: IBridgechainPorts = {};

        const portsLength: number = buf.readUint8();
        for (let i = 0; i < portsLength; i++) {
            const nameLength: number = buf.readUint8();
            const name: string = buf.readString(nameLength);
            const port: number = buf.readUint16();
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
