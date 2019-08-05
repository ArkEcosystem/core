import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { IBridgechainRegistrationAsset, ISeedNode } from "../interfaces";
import { MarketplaceTransactionsGroup, MarketplaceTransactionTypes } from "../marketplace-transactions";

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
                                    if: { items: { properties: { ipv6: { type: "null" } } } },
                                    then: { uniqueItemProperties: ["ipv4"] },
                                    else: { uniqueItemProperties: ["ipv4", "ipv6"] },
                                    items: {
                                        type: "object",
                                        required: ["ipv4"],
                                        properties: {
                                            ipv4: {
                                                type: "string",
                                                format: "ipv4",
                                            },
                                            ipv6: {
                                                oneOf: [
                                                    {
                                                        type: "string",
                                                        format: "ipv6",
                                                    },
                                                    {
                                                        type: "null",
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
    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make("5000000000");

    public serialize(): ByteBuffer {
        const { data } = this;

        const bridgechainRegistrationAsset = data.asset.bridgechainRegistration as IBridgechainRegistrationAsset;
        const seedNodes: ISeedNode[] = bridgechainRegistrationAsset.seedNodes;
        const seedNodesBuffers: Array<{ ipv4: Buffer; ipv6?: Buffer }> = [];
        let seedNodesBuffersLength = 0;

        const bridgechainName: Buffer = Buffer.from(bridgechainRegistrationAsset.name, "utf8");

        for (const seed of seedNodes) {
            let ipv6Buf: Buffer;
            let ipv6Length = 0;
            const ipv4Buf = Buffer.from(seed.ipv4, "utf8");

            if (seed.ipv6) {
                ipv6Buf = Buffer.from(seed.ipv6, "utf8");
                ipv6Length = ipv6Buf.length;
            }
            seedNodesBuffers.push({
                ipv4: ipv4Buf,
                ipv6: ipv6Buf,
            });

            seedNodesBuffersLength = seedNodesBuffersLength + ipv4Buf.length + ipv6Length;
        }

        const bridgechainGenesisHash: Buffer = Buffer.from(bridgechainRegistrationAsset.genesisHash, "utf8");

        const bridgechainGithubRepo: Buffer = Buffer.from(bridgechainRegistrationAsset.githubRepository, "utf8");

        const buffer: ByteBuffer = new ByteBuffer(
            bridgechainName.length +
                seedNodesBuffers.length * 2 +
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
            buffer.writeByte(seedBuf.ipv4.length);
            buffer.append(seedBuf.ipv4);

            if (seedBuf.ipv6) {
                buffer.writeByte(seedBuf.ipv6.length);
                buffer.append(seedBuf.ipv6);
            } else {
                buffer.writeByte(0);
            }
        }

        buffer.writeByte(bridgechainGenesisHash.length);
        buffer.append(bridgechainGenesisHash);

        buffer.writeByte(bridgechainGithubRepo.length);
        buffer.append(bridgechainGithubRepo);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const seedNodes: ISeedNode[] = [];

        const nameLength = buf.readUint8();
        const name = buf.readString(nameLength);

        const seedNodesLen = buf.readUint8();
        for (let i = 0; i < seedNodesLen; i++) {
            const ipv4Length = buf.readUint8();
            const ipv4 = buf.readString(ipv4Length);

            const ipv6Length = buf.readUint8();
            let ipv6;
            if (ipv6Length !== 0) {
                ipv6 = buf.readString(ipv6Length);
            }

            seedNodes.push({
                ipv4,
                ipv6,
            });
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
