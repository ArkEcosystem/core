import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { IBridgechainRegistrationAsset } from "../interfaces";
import {
    MarketplaceTransactionGroup,
    MarketplaceTransactionStaticFees,
    MarketplaceTransactionType,
} from "../marketplace-transactions";
import { seedNodesSchema } from "./utils/bridgechain-schemas";

const { schemas } = Transactions;

export class BridgechainRegistrationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MarketplaceTransactionGroup;
    public static type: number = MarketplaceTransactionType.BridgechainRegistration;
    public static key: string = "bridgechainRegistration";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainRegistration",
            properties: {
                type: { transactionType: MarketplaceTransactionType.BridgechainRegistration },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["bridgechainRegistration"],
                    properties: {
                        bridgechainRegistration: {
                            type: "object",
                            required: ["name", "seedNodes", "genesisHash", "bridgechainRepository"],
                            properties: {
                                name: {
                                    type: "string",
                                    minLength: 1,
                                    maxLength: 40,
                                },
                                seedNodes: seedNodesSchema,
                                genesisHash: {
                                    type: "string",
                                    minLength: 64,
                                    maxLength: 64,
                                    $ref: "transactionId",
                                },
                                bridgechainRepository: {
                                    type: "string",
                                    minLength: 1,
                                    maxLength: 100,
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MarketplaceTransactionStaticFees.BridgechainRegistration);

    public serialize(): ByteBuffer {
        const { data } = this;

        const bridgechainRegistrationAsset: IBridgechainRegistrationAsset = data.asset.bridgechainRegistration;
        const seedNodes: string[] = bridgechainRegistrationAsset.seedNodes;
        const seedNodesBuffers: Buffer[] = [];
        const bridgechainName: Buffer = Buffer.from(bridgechainRegistrationAsset.name, "utf8");

        let seedNodesBuffersLength: number = 0;
        for (const seed of seedNodes) {
            const seedBuffer: Buffer = Buffer.from(seed, "utf8");
            seedNodesBuffersLength += seedBuffer.length;
            seedNodesBuffers.push(seedBuffer);
        }

        seedNodesBuffersLength += seedNodesBuffers.length;

        const bridgechainGenesisHash: Buffer = Buffer.from(bridgechainRegistrationAsset.genesisHash, "utf8");
        const bridgechainRepository: Buffer = Buffer.from(bridgechainRegistrationAsset.bridgechainRepository, "utf8");

        const buffer: ByteBuffer = new ByteBuffer(
            bridgechainName.length +
                seedNodesBuffersLength +
                bridgechainGenesisHash.length +
                bridgechainRepository.length +
                4,
            true,
        );

        buffer.writeUint8(bridgechainName.length);
        buffer.append(bridgechainName);

        buffer.writeUint8(seedNodesBuffers.length);
        for (const seedBuffer of seedNodesBuffers) {
            buffer.writeUint8(seedBuffer.length);
            buffer.append(seedBuffer);
        }

        buffer.append(bridgechainGenesisHash);

        buffer.writeUint8(bridgechainRepository.length);
        buffer.append(bridgechainRepository);

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

        const genesisHash: string = buf.readString(64);
        const repositoryLength: number = buf.readUint8();
        const bridgechainRepository: string = buf.readString(repositoryLength);

        data.asset = {
            bridgechainRegistration: {
                name,
                seedNodes,
                genesisHash,
                bridgechainRepository,
            },
        };
    }
}
