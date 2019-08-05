import { Transactions } from "@arkecosystem/crypto";
import { Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { IBridgechainResignationAsset } from "../interfaces";
import { MarketplaceTransactionsGroup, MarketplaceTransactionTypes } from "../marketplace-transactions";

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
    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make("5000000000");

    public serialize(): ByteBuffer {
        const { data } = this;

        const bridgechainResignationAsset = data.asset.bridgechainResignation as IBridgechainResignationAsset;

        const buffer: ByteBuffer = new ByteBuffer(64, true);

        buffer.append(Buffer.from(bridgechainResignationAsset.registeredBridgechainId, "utf-8"));

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const registeredBridgechainId = buf.readString(64);

        this.data.asset = {
            bridgechainResignation: {
                registeredBridgechianId: registeredBridgechainId,
            },
        };
    }
}
