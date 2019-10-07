import { app, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Interfaces, Managers, Transactions, Types, Utils } from "@arkecosystem/crypto";

import { secrets } from "../utils/config/delegates.json";

const defaultPassphrase: string = secrets[0];

interface IPassphrasePair {
    passphrase: string;
    secondPassphrase: string;
}

export class TransactionFactory {
    public static transfer(recipientId?: string, amount: number = 2 * 1e8, vendorField?: string): TransactionFactory {
        const builder = Transactions.BuilderFactory.transfer()
            .amount(Utils.BigNumber.make(amount).toFixed())
            .recipientId(recipientId || Identities.Address.fromPassphrase(defaultPassphrase));

        if (vendorField) {
            builder.vendorField(vendorField);
        }

        return new TransactionFactory(builder);
    }

    public static secondSignature(secondPassphrase?: string): TransactionFactory {
        return new TransactionFactory(
            Transactions.BuilderFactory.secondSignature().signatureAsset(secondPassphrase || defaultPassphrase),
        );
    }

    public static delegateRegistration(username?: string): TransactionFactory {
        return new TransactionFactory(Transactions.BuilderFactory.delegateRegistration().usernameAsset(username));
    }

    public static delegateResignation(): TransactionFactory {
        return new TransactionFactory(Transactions.BuilderFactory.delegateResignation());
    }

    public static vote(publicKey?: string): TransactionFactory {
        return new TransactionFactory(
            Transactions.BuilderFactory.vote().votesAsset([
                `+${publicKey || Identities.PublicKey.fromPassphrase(defaultPassphrase)}`,
            ]),
        );
    }

    public static unvote(publicKey?: string): TransactionFactory {
        return new TransactionFactory(
            Transactions.BuilderFactory.vote().votesAsset([
                `-${publicKey || Identities.PublicKey.fromPassphrase(defaultPassphrase)}`,
            ]),
        );
    }

    public static multiSignature(participants?: string[], min?: number): TransactionFactory {
        let passphrases: string[];
        if (!participants) {
            passphrases = [secrets[0], secrets[1], secrets[2]];
        }

        participants = participants || [
            Identities.PublicKey.fromPassphrase(secrets[0]),
            Identities.PublicKey.fromPassphrase(secrets[1]),
            Identities.PublicKey.fromPassphrase(secrets[2]),
        ];

        const factory: TransactionFactory = new TransactionFactory(
            Transactions.BuilderFactory.multiSignature().multiSignatureAsset({
                publicKeys: participants,
                min: min || participants.length,
            }),
        );

        if (passphrases) {
            factory.withPassphraseList(passphrases);
        }

        factory.builder.senderPublicKey(participants[0]);
        return factory;
    }

    public static ipfs(ipfsId: string): TransactionFactory {
        return new TransactionFactory(Transactions.BuilderFactory.ipfs().ipfsAsset(ipfsId));
    }

    public static htlcLock(
        lockAsset: Interfaces.IHtlcLockAsset,
        recipientId?: string,
        amount: number = 2 * 1e8,
    ): TransactionFactory {
        const builder = Transactions.BuilderFactory.htlcLock()
            .htlcLockAsset(lockAsset)
            .amount(Utils.BigNumber.make(amount).toFixed())
            .recipientId(recipientId || Identities.Address.fromPassphrase(defaultPassphrase));

        return new TransactionFactory(builder);
    }

    public static htlcClaim(claimAsset: Interfaces.IHtlcClaimAsset): TransactionFactory {
        return new TransactionFactory(Transactions.BuilderFactory.htlcClaim().htlcClaimAsset(claimAsset));
    }

    public static htlcRefund(refundAsset: Interfaces.IHtlcRefundAsset): TransactionFactory {
        return new TransactionFactory(Transactions.BuilderFactory.htlcRefund().htlcRefundAsset(refundAsset));
    }

    public static multiPayment(payments: Array<{ recipientId: string; amount: string }>): TransactionFactory {
        const builder = Transactions.BuilderFactory.multiPayment();
        for (const payment of payments) {
            builder.addPayment(payment.recipientId, payment.amount);
        }
        return new TransactionFactory(builder);
    }

    public static getNonce(publicKey: string): Utils.BigNumber {
        try {
            return app.get<Contracts.Database.DatabaseService>("database").walletRepository.getNonce(publicKey);
        } catch {
            return Utils.BigNumber.ZERO;
        }
    }

    private builder: any;
    private network: Types.NetworkName = "testnet";
    private nonce: Utils.BigNumber;
    private fee: Utils.BigNumber;
    private timestamp: number;
    private passphrase: string = defaultPassphrase;
    private secondPassphrase: string;
    private passphraseList: string[];
    private passphrasePairs: IPassphrasePair[];
    private version: number;
    private senderPublicKey: string;
    private expiration: number;

    public constructor(builder) {
        this.builder = builder;
    }

    public withFee(fee: number): TransactionFactory {
        this.fee = Utils.BigNumber.make(fee);

        return this;
    }

    public withTimestamp(timestamp: number): TransactionFactory {
        this.timestamp = timestamp;

        return this;
    }

    public withNetwork(network: Types.NetworkName): TransactionFactory {
        this.network = network;

        return this;
    }

    public withHeight(height: number): TransactionFactory {
        Managers.configManager.setHeight(height);

        return this;
    }

    public withSenderPublicKey(sender: string): TransactionFactory {
        this.senderPublicKey = sender;

        return this;
    }

    public withNonce(nonce: Utils.BigNumber): TransactionFactory {
        this.nonce = nonce;

        return this;
    }

    public withExpiration(expiration: number): TransactionFactory {
        this.expiration = expiration;

        return this;
    }

    public withVersion(version: number): TransactionFactory {
        this.version = version;

        return this;
    }

    public withPassphrase(passphrase: string): TransactionFactory {
        this.passphrase = passphrase;

        return this;
    }

    public withSecondPassphrase(secondPassphrase: string): TransactionFactory {
        this.secondPassphrase = secondPassphrase;

        return this;
    }

    public withPassphraseList(passphrases: string[]): TransactionFactory {
        this.passphraseList = passphrases;

        return this;
    }

    public withPassphrasePair(passphrases: IPassphrasePair): TransactionFactory {
        this.passphrase = passphrases.passphrase;
        this.secondPassphrase = passphrases.secondPassphrase;

        return this;
    }

    public withPassphrasePairs(passphrases: IPassphrasePair[]): TransactionFactory {
        this.passphrasePairs = passphrases;

        return this;
    }

    public create(quantity = 1): Interfaces.ITransactionData[] {
        return this.make<Interfaces.ITransactionData>(quantity, "getStruct");
    }

    public createOne(): Interfaces.ITransactionData {
        return this.create(1)[0];
    }

    public build(quantity = 1): Interfaces.ITransaction[] {
        return this.make<Interfaces.ITransaction>(quantity, "build");
    }

    public getNonce(): Utils.BigNumber {
        if (this.nonce) {
            return this.nonce;
        }

        return TransactionFactory.getNonce(this.senderPublicKey);
    }

    private make<T>(quantity = 1, method: string): T[] {
        if (this.passphrasePairs && this.passphrasePairs.length) {
            return this.passphrasePairs.map(
                (passphrasePair: IPassphrasePair) =>
                    this.withPassphrase(passphrasePair.passphrase)
                        .withSecondPassphrase(passphrasePair.secondPassphrase)
                        .sign<T>(quantity, method)[0],
            );
        }

        return this.sign<T>(quantity, method);
    }

    private sign<T>(quantity: number, method: string): T[] {
        Managers.configManager.setFromPreset(this.network);

        if (!this.senderPublicKey) {
            this.senderPublicKey = Identities.PublicKey.fromPassphrase(this.passphrase);
        }

        const transactions: T[] = [];
        let nonce = this.getNonce();

        for (let i = 0; i < quantity; i++) {
            if (this.builder.constructor.name === "TransferBuilder") {
                // @FIXME: when we use any of the "withPassphrase*" methods the builder will
                // always remember the previous vendor field instead generating a new one on each iteration
                const vendorField: string = this.builder.data.vendorField;

                if (!vendorField || (vendorField && vendorField.startsWith("Test Transaction"))) {
                    this.builder.vendorField(`Test Transaction ${i + 1}`);
                }
            }

            if (this.builder.constructor.name === "DelegateRegistrationBuilder") {
                // @FIXME: when we use any of the "withPassphrase*" methods the builder will
                // always remember the previous username instead generating a new one on each iteration
                if (!this.builder.data.asset.delegate.username) {
                    this.builder = Transactions.BuilderFactory.delegateRegistration().usernameAsset(
                        this.getRandomUsername(),
                    );
                }
            }

            if (this.version) {
                this.builder.version(this.version);
            }

            if (this.builder.data.version > 1 && Managers.configManager.getMilestone().aip11) {
                nonce = nonce.plus(1);
                this.builder.nonce(nonce);
            }

            if (this.fee) {
                this.builder.fee(this.fee.toFixed());
            }

            if (this.timestamp) {
                this.builder.data.timestamp = this.timestamp;
            }

            if (this.senderPublicKey) {
                this.builder.senderPublicKey(this.senderPublicKey);
            }

            if (this.expiration) {
                this.builder.expiration(this.expiration);
            }

            this.builder.senderPublicKey(this.senderPublicKey);

            let sign = true;
            if (this.passphraseList && this.passphraseList.length) {
                sign = this.builder.constructor.name === "MultiSignatureBuilder";

                for (let i = 0; i < this.passphraseList.length; i++) {
                    this.builder.multiSign(this.passphraseList[i], i);
                }
            }

            if (sign) {
                this.builder.sign(this.passphrase);

                if (this.secondPassphrase) {
                    this.builder.secondSign(this.secondPassphrase);
                }
            }

            transactions.push(this.builder[method]());
        }

        return transactions;
    }

    private getRandomUsername(): string {
        return Math.random()
            .toString(36)
            .toLowerCase();
    }
}
