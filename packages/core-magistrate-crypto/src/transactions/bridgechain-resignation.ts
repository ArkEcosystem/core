import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBridgechainResignationAsset } from "../interfaces";

const { schemas } = Transactions;

const bridgechainResignationType: number = MagistrateTransactionType.BridgechainResignation;

export class BridgechainResignationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type = bridgechainResignationType;
    public static key: string = "bridgechainResignation";
    public static version: number = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(MagistrateTransactionStaticFees.BridgechainResignation);

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
                                bridgechainId: {
                                    $ref: "transactionId",
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

        AppUtils.assert.defined<IBridgechainResignationAsset>(data.asset?.bridgechainResignation);

        const buffer = new Utils.ByteBuffer(Buffer.alloc(32));
        buffer.writeBuffer(Buffer.from(data.asset.bridgechainResignation.bridgechainId, "hex"));

        return buffer;
    }

    public deserialize(buf: Utils.ByteBuffer): void {
        const { data } = this;

        data.asset = {
            bridgechainResignation: {
                bridgechainId: buf.readBuffer(32).toString("hex"),
            },
        };
    }
}
