import { createHash } from "crypto";
import { TransactionTypes } from "../constants";
import { crypto } from "../crypto/crypto";
import { TransactionDeserializer } from "../deserializers";
import { configManager } from "../managers";
import { TransactionSerializer } from "../serializers";
import { Bignum } from "../utils";

const { transactionIdFixTable } = configManager.getPreset("mainnet").exceptions;


export interface IDeserializedTransactionData {
    version: number;
    network: number;
    type: TransactionTypes;
    timestamp: any;
    senderPublicKey: string;
    fee: Bignum;

    amount?: Bignum;
    expiration?: number;
    recipientId?: string;

    asset?: any;
    vendorField?: string;
    vendorFieldHex?: string;

    signature: string;
    secondSignature?: string;
    signSignature?: string;
    signatures?: string[]; // Multisig

    timelock: any;
    timelockType: number;

    id: string;
    verified: boolean;
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

export class Transaction {
    public static applyV1Compatibility(deserialized: IDeserializedTransactionData) {
        if (deserialized.secondSignature) {
            deserialized.signSignature = deserialized.secondSignature;
        }

        if (deserialized.type === TransactionTypes.Vote) {
            deserialized.recipientId = crypto.getAddress(deserialized.senderPublicKey, deserialized.network);
        }

        if (deserialized.vendorFieldHex) {
            deserialized.vendorField = Buffer.from(deserialized.vendorFieldHex, "hex").toString("utf8");
        }

        if (deserialized.type === TransactionTypes.MultiSignature) {
            deserialized.asset.multisignature.keysgroup = deserialized.asset.multisignature.keysgroup.map(k => `+${k}`);
        }

        if (
            deserialized.type === TransactionTypes.SecondSignature ||
            deserialized.type === TransactionTypes.MultiSignature
        ) {
            deserialized.recipientId = crypto.getAddress(deserialized.senderPublicKey, deserialized.network);
        }

        if (!deserialized.id) {
            deserialized.id = crypto.getId(deserialized);

            // Apply fix for broken type 1 and 4 transactions, which were
            // erroneously calculated with a recipient id.
            if (transactionIdFixTable[deserialized.id]) {
                deserialized.id = transactionIdFixTable[deserialized.id];
            }
        }

        if (deserialized.type <= 4) {
            deserialized.verified = crypto.verify(deserialized);
        } else {
            deserialized.verified = false;
        }
    }

    /*
     * Return a clean transaction data from the serialized form.
     * @return {Transaction}
     */
    public static fromBytes(hexString) {
        return new Transaction(hexString);
    }

    // AIP11 serialization
    public static serialize(transaction): any {
        return TransactionSerializer.serialize(transaction);
    }

    public static deserialize(hexString): IDeserializedTransactionData {
        return TransactionDeserializer.deserialize(hexString);
    }

  
    public static canHaveVendorField(type: number): boolean {
        return [TransactionTypes.Transfer, TransactionTypes.TimelockTransfer].includes(type);
    }

    public senderPublicKey: any;
    public fee: Bignum;
    public vendorFieldHex: any;
    public amount: Bignum;
    public expiration: any;
    public recipientId: any;
    public asset: any;
    public timelockType: number;
    public timelock: any;
    public verified: boolean;
    public id: string;
    public timestamp: any;
    public type: any;
    public version: any;
    public network: any;
    public serialized: string;
    public data: any; // TODO: split Transaction into multiple classes

    constructor(data) {
        if (typeof data === "string") {
            this.serialized = data;
        } else {
            // @ts-ignore
            this.serialized = Transaction.serialize(data).toString("hex");
        }
        const deserialized = Transaction.deserialize(this.serialized);

        if (deserialized.version === 1) {
            Transaction.applyV1Compatibility(deserialized);
            this.verified = deserialized.verified;
            delete deserialized.verified;
        } else if (deserialized.version === 2) {
            deserialized.id = createHash("sha256")
                .update(Buffer.from(this.serialized, "hex"))
                .digest()
                .toString("hex");

            // TODO: enable AIP11 when network ready
            this.verified = false;
        }
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
            this[key] = deserialized[key];
        }, this);

        this.data = deserialized;
    }

    public verify() {
        return this.verified;
    }

    /*
     * Return transaction data.
     */
    public toJson() {
        // Convert Bignums
        const data = Object.assign({}, this.data);
        data.amount = +data.amount.toFixed();
        data.fee = +data.fee.toFixed();

        return data;
    }
}
