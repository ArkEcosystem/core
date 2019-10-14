import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import Long from "long";

import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBridgechainResignationAsset } from "../interfaces";

const { schemas } = Transactions;

const bridgechainResignationType: number = MagistrateTransactionType.BridgechainResignation;

export class BridgechainResignationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type = bridgechainResignationType;
    public static key: string = "bridgechainResignation";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainResignation",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: bridgechainResignationType },
                typeGroup: { const: MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["bridgechainResignation"],
                    properties: {
                        bridgechainResignation: {
                            type: "object",
                            required: ["bridgechainId"],
                            properties: {
                                bridgechainId: { bignumber: { minimum: 1 } },
                            },
                        },
                    },
                },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MagistrateTransactionStaticFees.BridgechainResignation);

    public serialize(): ByteBuffer {
        const { data } = this;

        const bridgechainResignationAsset = data.asset.bridgechainResignation as IBridgechainResignationAsset;
        const buffer: ByteBuffer = new ByteBuffer(8, true);
        buffer.writeUint64(Long.fromString(bridgechainResignationAsset.bridgechainId.toString()));

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const bridgechainId: Utils.BigNumber = Utils.BigNumber.make(buf.readUint64().toString());
        data.asset = {
            bridgechainResignation: {
                bridgechainId,
            },
        };
    }
}
