import ByteBuffer from "bytebuffer";

import { TransactionTypeGroup } from "../../enums";
import { NotImplemented } from "../../errors";
import { Address } from "../../identities";
import { ISchemaValidationResult, ITransaction, ITransactionData, ITransactionJson } from "../../interfaces";
import { configManager } from "../../managers/config";
import { BigNumber } from "../../utils/bignum";
import { Verifier } from "../verifier";
import { TransactionSchema } from "./schemas";

export abstract class Transaction implements ITransaction {
    public static type: number | undefined = undefined;
    public static typeGroup: number | undefined = undefined;
    public static version: number = 1;
    public static key: string | undefined = undefined;

    protected static defaultStaticFee: BigNumber = BigNumber.ZERO;

    public isVerified: boolean = false;
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public data: ITransactionData;
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public serialized: Buffer;
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public timestamp: number;

    public static getSchema(): TransactionSchema {
        throw new NotImplemented();
    }

    public static staticFee(feeContext: { height?: number; data?: ITransactionData } = {}): BigNumber {
        const milestones = configManager.getMilestone(feeContext.height);
        if (milestones.fees && milestones.fees.staticFees && this.key) {
            const fee: any = milestones.fees.staticFees[this.key];

            if (fee !== undefined) {
                return BigNumber.make(fee);
            }
        }

        return this.defaultStaticFee;
    }

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

        return data;
    }

    public toString(): string {
        const parts: string[] = [];

        if (this.data.senderPublicKey) {
            parts.push(Address.fromPublicKey(this.data.senderPublicKey));
        }

        if (this.data.nonce) {
            parts.push(`#${this.data.nonce}`);
        }

        const key: string = (this as any).__proto__.constructor.key;
        const version: string = (this as any).__proto__.constructor.version;
        parts.push(`${key} v${version}`);

        if (this.data.id) {
            parts.push(this.data.id);
        }

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
        return (this as any).__proto__.constructor.staticFee({ data: this.data });
    }
}
