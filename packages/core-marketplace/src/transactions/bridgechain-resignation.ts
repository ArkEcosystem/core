import { Transactions } from "@arkecosystem/crypto";
import { Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { IBridgechainResignationAsset } from "../interfaces";
import {
    MarketplaceTransactionsGroup,
    MarketplaceTransactionStaticFees,
    MarketplaceTransactionTypes,
} from "../marketplace-transactions";

const { schemas } = Transactions;

const bridgechainResignationType: number = MarketplaceTransactionTypes.BridgechainResignation;

export class BridgechainResignationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MarketplaceTransactionsGroup;
    public static type = bridgechainResignationType;
    public static key: string = "bridgechainResignation";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainResignation",
            properties: {
                type: { transactionType: bridgechainResignationType },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["bridgechainResignation"],
                    properties: {
                        bridgechainResignation: {
                            type: "object",
                            required: ["registeredBridgechainId"],
                            properties: {
                                registeredBridgechainId: {
                                    type: "string",
                                    minLength: 64,
                                    maxLength: 64,
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MarketplaceTransactionStaticFees.BridgechainResignation);

    public serialize(): ByteBuffer {
        const { data } = this;

        const bridgechainResignationAsset = data.asset.bridgechainResignation as IBridgechainResignationAsset;
        const bridgechainResignationBufs: Buffer = Buffer.from(bridgechainResignationAsset.registeredBridgechainId);
        const buffer: ByteBuffer = new ByteBuffer(64, true);
        buffer.append(bridgechainResignationBufs, "utf-8");
        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const registeredBridgechainId = buf.readString(64);

        data.asset = {
            bridgechainResignation: {
                registeredBridgechainId,
            },
        };
    }
}
