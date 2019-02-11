import { TransactionTypes } from "../constants";
import { crypto } from "../crypto";
import { TransactionDeserializer } from "../deserializers";
import { TransactionSerializer } from "../serializers";
import { Bignum, isException } from "../utils";

export interface ITransactionAsset {
    signature?: {
        publicKey: string;
    };
    delegate?: {
        username: string;
        publicKey?: string;
    };
    votes?: string[];
    multisignature?: IMultiSignatureAsset;
    ipfs?: {
        dag: string;
    };
    payments?: any;
}

export interface IMultiSignatureAsset {
    min: number;
    keysgroup: string[];
    lifetime: number;
}

export interface ITransactionData {
    version?: number;
    network?: number;

    type: TransactionTypes;
    timestamp: number;
    senderPublicKey: string;

    fee: Bignum | number | string;
    amount: Bignum | number | string;

    expiration?: number;
    recipientId?: string;

    asset?: ITransactionAsset;
    vendorField?: string;
    vendorFieldHex?: string;

    id?: string;
    signature?: string;
    secondSignature?: string;
    signSignature?: string;
    signatures?: string[];

    blockId?: string;
    sequence?: number;

    timelock?: any;
    timelockType?: number;

    ipfsHash?: string;
    payments?: { [key: string]: any };
}

/**
 * TODO copy some parts to ArkDocs
 * @classdesc This model holds the transaction data and its serialization
 *
 * A Transaction stores on the db:
 *   - id
 *   - version (version of the transaction generation process, ie: serialization)
 *   - blockId (id of the block that contains the transaction)
 *   - timestamp (related to the genesis block)
 *   - senderPublicKey (public key of the sender)
 *   - recipientId (address of the recipient)
 *   - type
 *   - vendorFieldHex (hexadecimal version of the vendorField)
 *   - amount (in arktoshi)
 *   - fee (in arktoshi)
 *   - serialized
 *
 * Apart, the Model includes other fields:
 *   - signature
 *   - secondSignature
 *   - vendorField
 *
 *   - assets
 *   - network
 */

export class Transaction implements ITransactionData {
    public static serialize(transaction: ITransactionData): Buffer {
        return TransactionSerializer.serialize(transaction);
    }

    public static deserialize(hexString: string): ITransactionData {
        return TransactionDeserializer.deserialize(hexString);
    }

    public static canHaveVendorField(type: number): boolean {
        return [TransactionTypes.Transfer, TransactionTypes.TimelockTransfer].includes(type);
    }

    public data: ITransactionData;
    public serialized: string;
    public verified: boolean;

    // TODO: remove all duplicated data properties from Transaction class
    public id: string;
    public version: number;
    public network: number;
    public type: TransactionTypes;
    public timestamp: number;
    public senderPublicKey: string;
    public fee: Bignum;
    public amount: Bignum;
    public expiration?: number;
    public recipientId?: string;
    public asset?: any;
    public vendorField?: string;
    public vendorFieldHex?: string;
    public signature: string;
    public secondSignature?: string;
    public signSignature?: string;
    public signatures?: string[];
    public blockId?: string;
    public sequence?: number;
    public timelock?: any;
    public timelockType?: number;

    constructor(data: string | ITransactionData) {
        if (typeof data === "string") {
            this.serialized = data;
        } else {
            this.serialized = Transaction.serialize(data).toString("hex");
        }

        this.data = Transaction.deserialize(this.serialized);
        this.verified = (this.data.type < 4 && crypto.verify(this.data)) || isException(this.data);

        // TODO: remove this
        [
            "id",
            "sequence",
            "version",
            "timestamp",
            "senderPublicKey",
            "recipientId",
            "type",
            "vendorField",
            "vendorFieldHex",
            "amount",
            "fee",
            "blockId",
            "signature",
            "signatures",
            "secondSignature",
            "signSignature",
            "asset",
            "expiration",
            "timelock",
            "timelockType",
        ].forEach(key => {
            this[key] = this.data[key];
        }, this);
    }

    public verify(): boolean {
        return this.verified;
    }

    public toJson(): any {
        const data = Object.assign({}, this.data);
        data.amount = +(data.amount as Bignum).toFixed();
        data.fee = +(data.fee as Bignum).toFixed();

        return data;
    }
}
