import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";

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
    protected static defaultStaticFee = Utils.BigNumber.make(MagistrateTransactionStaticFees.BridgechainResignation);

    public serialize(): ByteBuffer {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(32, true);
        buffer.append(data.asset.bridgechainResignation.bridgechainId, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const bridgechainId: string = buf.readBytes(32).toString("hex");
        data.asset = {
            bridgechainResignation: {
                bridgechainId,
            },
        };
    }
}
