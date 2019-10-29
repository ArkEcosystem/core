import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBridgechainUpdateAsset } from "../interfaces";
import { seedNodesSchema } from "./utils/bridgechain-schemas";

const { schemas } = Transactions;

export class BridgechainUpdateTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type = MagistrateTransactionType.BridgechainUpdate;
    public static key: string = "bridgechainUpdate";

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
                            required: ["bridgechainId", "seedNodes"],
                            properties: {
                                bridgechainId: { type: "integer", minimum: 1 },
                                seedNodes: seedNodesSchema,
                            },
                        },
                    },
                },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MagistrateTransactionStaticFees.BridgechainUpdate);

    public serialize(): ByteBuffer {
        const { data } = this;

        const bridgechainUpdateAsset = data.asset.bridgechainUpdate as IBridgechainUpdateAsset;

        let seedNodesBuffersLength = 0;
        const seedNodesBuffers: Buffer[] = [];
        const seedNodes: string[] = bridgechainUpdateAsset.seedNodes;

        for (const seed of seedNodes) {
            const seedBuf = Buffer.from(seed, "utf8");
            seedNodesBuffersLength = seedNodesBuffersLength + seedBuf.length;
            seedNodesBuffers.push(seedBuf);
        }

        const buffer: ByteBuffer = new ByteBuffer(4 + 1 + seedNodesBuffersLength + seedNodes.length, true);
        buffer.writeUint32(bridgechainUpdateAsset.bridgechainId);

        buffer.writeUint8(seedNodesBuffers.length);
        for (const seedBuf of seedNodesBuffers) {
            buffer.writeUint8(seedBuf.length);
            buffer.append(seedBuf);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const bridgechainId: number = buf.readUint32();

        const seedNodes: string[] = [];
        const seedNodesLength: number = buf.readUint8();
        for (let i = 0; i < seedNodesLength; i++) {
            const ipLength = buf.readUint8();
            const ip = buf.readString(ipLength);
            seedNodes.push(ip);
        }

        data.asset = {
            bridgechainUpdate: {
                bridgechainId,
                seedNodes,
            },
        };
    }
}
