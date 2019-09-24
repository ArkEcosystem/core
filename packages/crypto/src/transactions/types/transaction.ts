import { app } from "@arkecosystem/core-container";
import { TransactionTypeGroup } from "../../enums";
import { NotImplementedError } from "../../errors";
import { ISchemaValidationResult, ITransaction, ITransactionData, ITransactionJson } from "../../interfaces";
import { configManager } from "../../managers/config";
import { BigNumber } from "../../utils/bignum";
import { Verifier } from "../verifier";
import { TransactionSchema } from "./schemas";

export abstract class Transaction implements ITransaction {
    public get id(): string {
        return this.data.id;
    }

    public get type(): number {
        return this.data.type;
    }

    public get typeGroup(): number {
        return this.data.typeGroup;
    }

    public get verified(): boolean {
        return this.isVerified;
    }

    public get key(): string {
        return (this as any).__proto__.constructor.key;
    }

    public get staticFee(): BigNumber {
        return (this as any).__proto__.constructor.staticFee({ data: this.data });
    }

    public static type: number = undefined;
    public static typeGroup: number = undefined;
    public static key: string = undefined;

    public static getSchema(): TransactionSchema {
        throw new NotImplementedError();
    }

    public static staticFee(feeContext: { height?: number; data?: ITransactionData } = {}): BigNumber {
        const milestones = configManager.getMilestone(feeContext.height);
        if (milestones.fees && milestones.fees.staticFees) {
            const fee: any = milestones.fees.staticFees[this.key];
            if (fee !== undefined) {
                return BigNumber.make(fee);
            }
        }

        return this.defaultStaticFee;
    }

    protected static defaultStaticFee: BigNumber = BigNumber.ZERO;

    public isVerified: boolean;

    public data: ITransactionData;
    public serialized: Buffer;
    public timestamp: number;

    public abstract serialize(): ByteBuffer;
    public abstract deserialize(buf: ByteBuffer): void;

    public verify(): boolean {
        return Verifier.verify(this.data);
    }

    public verifySecondSignature(publicKey: string): boolean {
        return Verifier.verifySecondSignature(this.data, publicKey);
    }

    public verifySchema(): ISchemaValidationResult {
        return Verifier.verifySchema(this.data);
    }

    public toJson(): ITransactionJson {
        const data: ITransactionJson = JSON.parse(JSON.stringify(this.data));

        if (data.typeGroup === TransactionTypeGroup.Core) {
            delete data.typeGroup;
        }

        if (data.version === 1) {
            delete data.nonce;
        } else {
            delete data.timestamp;
        }

        if (!data.vendorFieldHex) {
            delete data.vendorFieldHex;
        }

        return data;
    }

    public hasVendorField(): boolean {
        return false;
    }

    /**
     * Calculate the expiration height of a transaction.
     * An expiration height H means that the transaction cannot be included in block at height
     * H or any higher block.
     * If the user did not specify an expiration height when creating the transaction then
     * we calculate one from the timestamp of the transaction creation and the configured
     * maximum transaction age.
     * @return number expiration height or null if the transaction does not expire
     */
    public calculateExpiration(
        context: {
            blockTime: number;
            currentHeight: number;
            now: number;
        },
    ): number {
        const data: ITransactionData = this.data;
        // We ignore data.expiration in v1 transactions because it is not signed
        // by the transaction creator.
        // TODO: check if ok
        if (data.version >= 2) {
            // tslint:disable-next-line:no-null-keyword
            return data.expiration || null;
        }

        const maxTransactionAge = app.resolveOptions("transaction-pool").maxTransactionAge;

        // Since the user did not specify an expiration we set one by calculating
        // approximately the height of the chain as of the time the transaction was
        // created and adding maxTransactionAge to that.

        // Both now and data.timestamp use [number of seconds since the genesis block].
        const createdSecondsAgo: number = context.now - data.timestamp;

        const createdBlocksAgo: number = Math.floor(createdSecondsAgo / context.blockTime);

        const createdAtHeight: number = context.currentHeight - createdBlocksAgo;

        return createdAtHeight + maxTransactionAge;
    }
}
