import { Transactions } from "@arkecosystem/crypto";
import { Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MarketplaceTransactionTypes } from "../marketplace-transactions";

const { schemas } = Transactions;

const bridgechainResignationType: number = MarketplaceTransactionTypes.BridgechainResignation;

export class BridgechainResignationTransaction extends Transactions.Transaction {
    public static type = bridgechainResignationType;
    public static key: string = "bridgechainResignation";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainResignation",
            properties: {
                type: { transactionType: bridgechainResignationType },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
            },
            asset: {
                type: "object",
                required: ["registrationTransactionId"],
                properties: {
                    registrationTransactionId: {
                        type: "string",
                        minLength: 64,
                        maxLength: 64,
                    },
                },
            },
        });
    }
    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make("5000000000");

    public serialize(): ByteBuffer {
        const { data } = this;
        const registrationTransactionId: Buffer = Buffer.from(data.asset.registrationTransactionId, "utf8");

        const buffer: ByteBuffer = new ByteBuffer(64);

        buffer.append(registrationTransactionId);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const registrationTransactionId = buf.readString(64);

        data.asset = {
            registrationTransactionId,
        };
    }
}
