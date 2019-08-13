import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { IBridgechainUpdateAsset } from "../interfaces";
import {
    MarketplaceTransactionsGroup,
    MarketplaceTransactionStaticFees,
    MarketplaceTransactionTypes,
} from "../marketplace-transactions";

const { schemas } = Transactions;

const bridgechainUpdateType: number = MarketplaceTransactionTypes.BridgechainUpdate;

export class BridgechainUpdateTransaction extends Transactions.Transaction {
    public static typeGroup: number = MarketplaceTransactionsGroup;
    public static type = bridgechainUpdateType;
    public static key: string = "bridgechainUpdate";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainUpdate",
            properties: {
                type: { transactionType: bridgechainUpdateType },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["bridgechainUpdate"],
                    properties: {
                        bridgechainUpdate: {
                            type: "object",
                            required: ["registeredBridgechainId", "seedNodes"],
                            properties: {
                                registeredBridgechainId: {
                                    type: "string",
                                    minLength: 64,
                                    maxLength: 64,
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
                            },
                        },
                    },
                },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MarketplaceTransactionStaticFees.BridgechainUpdate);

    public serialize(): ByteBuffer {
        const { data } = this;

        const bridgechainUpdateAsset = data.asset.bridgechainUpdate as IBridgechainUpdateAsset;
        const bridgechainUpdateId: Buffer = Buffer.from(bridgechainUpdateAsset.registeredBridgechainId);

        let seedNodesBuffersLength = 0;
        const seedNodesBuffers: Buffer[] = [];
        const seedNodes: string[] = bridgechainUpdateAsset.seedNodes;

        for (const seed of seedNodes) {
            const seedBuf = Buffer.from(seed, "utf8");
            seedNodesBuffersLength = seedNodesBuffersLength + seedBuf.length;
            seedNodesBuffers.push(seedBuf);
        }

        const buffer: ByteBuffer = new ByteBuffer(64 + seedNodesBuffersLength + 1 + seedNodes.length, true);

        buffer.append(bridgechainUpdateId);

        buffer.writeByte(seedNodesBuffers.length);
        for (const seedBuf of seedNodesBuffers) {
            buffer.writeByte(seedBuf.length);
            buffer.append(seedBuf);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const bridgechainUpdateId = buf.readString(64);

        const seedNodes: string[] = [];
        const seedNodesLength = buf.readUint8();
        for (let i = 0; i < seedNodesLength; i++) {
            const ipLength = buf.readUint8();
            const ip = buf.readString(ipLength);
            seedNodes.push(ip);
        }

        data.asset = {
            bridgechainUpdate: {
                registeredBridgechainId: bridgechainUpdateId,
                seedNodes,
            },
        };
    }
}
