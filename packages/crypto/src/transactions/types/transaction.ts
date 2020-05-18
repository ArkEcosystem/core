import ByteBuffer from "bytebuffer";

import { CryptoManager } from "../..";
import { TransactionTypeGroup } from "../../enums";
import { NotImplemented } from "../../errors";
import {
    ISchemaValidationResult,
    ITransaction,
    ITransactionData,
    ITransactionJson,
    SchemaError,
} from "../../interfaces";
import { BigNumber } from "../../types";
import { TransactionTools } from "../transactions-manager";
import { TransactionSchema } from "./schemas";

export abstract class Transaction<T, U extends ITransactionData = ITransactionData, E = SchemaError>
    implements ITransaction<U, E> {
    public static type: number | undefined = undefined;
    public static typeGroup: number | undefined = undefined;
    public static version: number = 1;
    public static key: string | undefined = undefined;
    protected static defaultStaticFee: number | string = 0;

    public isVerified: boolean = false;
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public data: U;
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public serialized: Buffer;
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public timestamp: number;

    public constructor(
        protected cryptoManager: CryptoManager<T>,
        protected transactionTools: TransactionTools<T, U, E>,
    ) {}

    public static staticFee<T, U extends ITransactionData>(
        cryptoManager: CryptoManager<T>,
        feeContext: { height?: number; data?: U } = {},
    ): BigNumber {
        const milestones = cryptoManager.MilestoneManager.getMilestone(feeContext.height);
        if (milestones.fees && milestones.fees.staticFees && this.key) {
            const fee: any = milestones.fees.staticFees[this.key];

            if (fee !== undefined) {
                return cryptoManager.LibraryManager.Libraries.BigNumber.make(fee);
            }
        }

        return cryptoManager.LibraryManager.Libraries.BigNumber.make(Transaction.defaultStaticFee);
    }

    public static getSchema(): TransactionSchema {
        throw new NotImplemented();
    }

    public verify(): boolean {
        return this.transactionTools.Verifier.verify(this.data);
    }

    public verifySecondSignature(publicKey: string): boolean {
        return this.transactionTools.Verifier.verifySecondSignature(this.data, publicKey);
    }

    public verifySchema(): ISchemaValidationResult<U, E> {
        return this.transactionTools.Verifier.verifySchema(this.data);
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

        return data;
    }

    public toString(): string {
        const parts: string[] = [];

        if (this.data.senderPublicKey && this.data.nonce) {
            parts.push(
                `${this.cryptoManager.Identities.Address.fromPublicKey(this.data.senderPublicKey)}#${this.data.nonce}`,
            );
        } else if (this.data.senderPublicKey) {
            parts.push(`${this.cryptoManager.Identities.Address.fromPublicKey(this.data.senderPublicKey)}`);
        }

        if (this.data.id) {
            parts.push(this.data.id.slice(-8));
        }

        parts.push(`${this.key[0].toUpperCase()}${this.key.slice(1)} v${this.data.version}`);

        return parts.join(" ");
    }

    public hasVendorField(): boolean {
        return false;
    }

    public abstract serialize(): ByteBuffer | undefined;
    public abstract deserialize(buf: ByteBuffer): void;

    public get id(): string | undefined {
        return this.data.id;
    }

    public get type(): number {
        return this.data.type;
    }

    public get typeGroup(): number | undefined {
        return this.data.typeGroup;
    }

    public get verified(): boolean {
        return this.isVerified;
    }

    public get key(): string {
        return (this as any).__proto__.constructor.key;
    }

    public get staticFee(): BigNumber {
        return (this as any).__proto__.constructor.staticFee(this.cryptoManager, { data: this.data });
    }
}
