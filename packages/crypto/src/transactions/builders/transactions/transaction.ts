import { CryptoManager } from "../../../crypto-manager";
import { TransactionTypeGroup } from "../../../enums";
import { MissingTransactionSignatureError, VendorFieldLengthExceededError } from "../../../errors";
import { IKeyPair, ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionTools } from "../../transactions-manager";

export abstract class TransactionBuilder<
    T,
    TBuilder extends TransactionBuilder<T, TBuilder, U, E>,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> {
    public data: U;

    protected signWithSenderAsRecipient = false;

    public constructor(
        protected cryptoManager: CryptoManager<T>,
        protected transactionTools: TransactionTools<T, U, E>,
    ) {
        this.data = {
            id: undefined,
            timestamp: cryptoManager.LibraryManager.Crypto.Slots.getTime(),
            typeGroup: TransactionTypeGroup.Test,
            nonce: cryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
            version: cryptoManager.MilestoneManager.getMilestone().aip11 ? 0x02 : 0x01,
        } as U;
    }

    // public build(data: Partial<U> = {}): ITransaction<U, E> {
    //     return this.transactionsManager.TransactionFactory.fromData({ ...this.data, ...data }, false);
    // }

    public version(version: number): TBuilder {
        this.data.version = version;

        return this.instance();
    }

    public typeGroup(typeGroup: number): TBuilder {
        this.data.typeGroup = typeGroup;

        return this.instance();
    }

    public nonce(nonce: string): TBuilder {
        if (nonce) {
            this.data.nonce = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(nonce);
        }

        return this.instance();
    }

    public fee(fee: string): TBuilder {
        if (fee) {
            this.data.fee = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(fee);
        }

        return this.instance();
    }

    public amount(amount: string): TBuilder {
        this.data.amount = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(amount);

        return this.instance();
    }

    public recipientId(recipientId: string): TBuilder {
        this.data.recipientId = recipientId;

        return this.instance();
    }

    public senderPublicKey(publicKey: string): TBuilder {
        this.data.senderPublicKey = publicKey;

        return this.instance();
    }

    public vendorField(vendorField: string): TBuilder {
        const limit: number = this.cryptoManager.LibraryManager.Utils.maxVendorFieldLength();

        if (vendorField) {
            if (Buffer.from(vendorField).length > limit) {
                throw new VendorFieldLengthExceededError(limit);
            }

            this.data.vendorField = vendorField;
        }

        return this.instance();
    }

    public sign(passphrase: string): TBuilder {
        const keys: IKeyPair = this.cryptoManager.Identities.Keys.fromPassphrase(passphrase);
        return this.signWithKeyPair(keys);
    }

    public signWithWif(wif: string): TBuilder {
        const keys: IKeyPair = this.cryptoManager.Identities.Keys.fromWIF(wif);

        return this.signWithKeyPair(keys);
    }

    public secondSign(secondPassphrase: string): TBuilder {
        return this.secondSignWithKeyPair(this.cryptoManager.Identities.Keys.fromPassphrase(secondPassphrase));
    }

    public secondSignWithWif(wif: string): TBuilder {
        const keys = this.cryptoManager.Identities.Keys.fromWIF(wif);

        return this.secondSignWithKeyPair(keys);
    }

    public multiSign(passphrase: string, index: number): TBuilder {
        const keys: IKeyPair = this.cryptoManager.Identities.Keys.fromPassphrase(passphrase);
        return this.multiSignWithKeyPair(index, keys);
    }

    public multiSignWithWif(index: number, wif: string): TBuilder {
        const keys = this.cryptoManager.Identities.Keys.fromWIF(wif);

        return this.multiSignWithKeyPair(index, keys);
    }

    public verify(): boolean {
        return this.transactionTools.Verifier.verifyHash(this.data);
    }

    public getStruct(): U {
        if (!this.data.senderPublicKey || (!this.data.signature && !this.data.signatures)) {
            throw new MissingTransactionSignatureError();
        }

        const struct: U = {
            id: this.transactionTools.Utils.getId(this.data).toString(),
            signature: this.data.signature,
            secondSignature: this.data.secondSignature,
            version: this.data.version,
            type: this.data.type,
            fee: this.data.fee,
            senderPublicKey: this.data.senderPublicKey,
            // TODO: check where this is needed
            network: this.cryptoManager.NetworkConfigManager.get("network").pubKeyHash,
        } as U;

        if (this.data.version === 1) {
            struct.timestamp = this.data.timestamp;
        } else {
            struct.typeGroup = this.data.typeGroup;
            struct.nonce = this.data.nonce;
        }

        if (Array.isArray(this.data.signatures)) {
            struct.signatures = this.data.signatures;
        }

        return struct;
    }

    private signWithKeyPair(keys: IKeyPair): TBuilder {
        this.data.senderPublicKey = keys.publicKey;

        if (this.signWithSenderAsRecipient) {
            this.data.recipientId = this.cryptoManager.Identities.Address.fromPublicKey(keys.publicKey);
        }

        this.data.signature = this.transactionTools.Signer.sign(this.getSigningObject(), keys);

        return this.instance();
    }

    private secondSignWithKeyPair(keys: IKeyPair): TBuilder {
        this.data.secondSignature = this.transactionTools.Signer.secondSign(this.getSigningObject(), keys);
        return this.instance();
    }

    private multiSignWithKeyPair(index: number, keys: IKeyPair): TBuilder {
        if (!this.data.signatures) {
            this.data.signatures = [];
        }

        this.version(2);
        this.transactionTools.Signer.multiSign(this.getSigningObject(), keys, index);

        return this.instance();
    }

    private getSigningObject(): U {
        const data: U = {
            ...this.data,
        };

        for (const key of Object.keys(data)) {
            if (["model", "network", "id"].includes(key)) {
                delete data[key];
            }
        }

        return data;
    }

    protected abstract instance(): TBuilder;
}
