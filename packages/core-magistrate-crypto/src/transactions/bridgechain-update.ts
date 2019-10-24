import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import Long from "long";

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
                                bridgechainId: { bignumber: { minimum: 1 } },
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

        const bridgechainUpdateAsset: IBridgechainUpdateAsset = AppUtils.assert.defined(data.asset!.bridgechainUpdate);

        let seedNodesBuffersLength = 0;
        const seedNodesBuffers: Buffer[] = [];
        const seedNodes: string[] = bridgechainUpdateAsset.seedNodes;

        for (const seed of seedNodes) {
            const seedBuf = Buffer.from(seed, "utf8");
            seedNodesBuffersLength = seedNodesBuffersLength + seedBuf.length;
            seedNodesBuffers.push(seedBuf);
        }

        const buffer: ByteBuffer = new ByteBuffer(64 + seedNodesBuffersLength + 1 + seedNodes.length, true);
        buffer.writeUint64(Long.fromString(bridgechainUpdateAsset.bridgechainId.toFixed()));

        buffer.writeUint8(seedNodesBuffers.length);
        for (const seedBuf of seedNodesBuffers) {
            buffer.writeUint8(seedBuf.length);
            buffer.append(seedBuf);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const bridgechainId: Utils.BigNumber = Utils.BigNumber.make(buf.readUint64().toString());

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
