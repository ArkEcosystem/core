import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { IBridgechainRegistrationAsset } from "../interfaces";
import {
    MarketplaceTransactionsGroup,
    MarketplaceTransactionStaticFees,
    MarketplaceTransactionTypes,
} from "../marketplace-transactions";

const { schemas } = Transactions;

const bridgechainRegistrationType: number = MarketplaceTransactionTypes.BridgechainRegistration;

export class BridgechainRegistrationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MarketplaceTransactionsGroup;
    public static type = bridgechainRegistrationType;
    public static key: string = "bridgechainRegistration";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainRegistration",
            properties: {
                type: { transactionType: bridgechainRegistrationType },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["bridgechainRegistration"],
                    properties: {
                        bridgechainRegistration: {
                            type: "object",
                            required: ["name", "seedNodes", "genesisHash", "githubRepository"],
                            properties: {
                                name: {
                                    type: "string",
                                    minLength: 1,
                                    maxLength: 40,
                                },
                                seedNodes: {
                                    type: "array",
                                    maxItems: 15,
                                    minItems: 1,
                                    uniqueItems: true,
                                    items: {
                                        type: "string",
                                        required: ["ip"],
                                        properties: {
                                            ip: {
                                                oneOf: [
                                                    {
                                                        type: "string",
                                                        format: "ipv4",
                                                    },
                                                    {
                                                        type: "string",
                                                        format: "ipv6",
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                                genesisHash: {
                                    type: "string",
                                    minLength: 64,
                                    maxLength: 64,
                                },
                                githubRepository: {
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

        const bridgechainRegistrationAsset = data.asset.bridgechainRegistration as IBridgechainRegistrationAsset;
        const seedNodes: string[] = bridgechainRegistrationAsset.seedNodes;
        const seedNodesBuffers: Buffer[] = [];
        let seedNodesBuffersLength = 0;

        const bridgechainName: Buffer = Buffer.from(bridgechainRegistrationAsset.name, "utf8");

        for (const seed of seedNodes) {
            const seedBuf = Buffer.from(seed, "utf8");
            seedNodesBuffersLength = seedNodesBuffersLength + seedBuf.length;
            seedNodesBuffers.push(seedBuf);
        }
        seedNodesBuffersLength = seedNodesBuffersLength + seedNodesBuffers.length;

        const bridgechainGenesisHash: Buffer = Buffer.from(bridgechainRegistrationAsset.genesisHash, "utf8");

        const bridgechainGithubRepo: Buffer = Buffer.from(bridgechainRegistrationAsset.githubRepository, "utf8");

        const buffer: ByteBuffer = new ByteBuffer(
            bridgechainName.length +
                seedNodesBuffersLength +
                bridgechainGenesisHash.length +
                bridgechainGithubRepo.length +
                4,
            true,
        );

        buffer.writeByte(bridgechainName.length);
        buffer.append(bridgechainName);

        buffer.writeByte(seedNodesBuffers.length);
        for (const seedBuf of seedNodesBuffers) {
            buffer.writeByte(seedBuf.length);
            buffer.append(seedBuf);
        }

        buffer.writeByte(bridgechainGenesisHash.length);
        buffer.append(bridgechainGenesisHash);

        buffer.writeByte(bridgechainGithubRepo.length);
        buffer.append(bridgechainGithubRepo);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const seedNodes: string[] = [];

        const nameLength = buf.readUint8();
        const name = buf.readString(nameLength);

        const seedNodesLength = buf.readUint8();
        for (let i = 0; i < seedNodesLength; i++) {
            const ipLength = buf.readUint8();
            const ip = buf.readString(ipLength);
            seedNodes.push(ip);
        }

        const genesisHashLength = buf.readUint8();
        const genesisHash = buf.readString(genesisHashLength);

        const githubRepositoryLength = buf.readUint8();
        const githubRepository = buf.readString(githubRepositoryLength);

        data.asset = {
            bridgechainRegistration: {
                name,
                seedNodes,
                genesisHash,
                githubRepository,
            },
        };
    }
}
