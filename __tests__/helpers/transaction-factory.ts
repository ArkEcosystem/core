import { configManager, ITransactionData, NetworkName, Transaction, transactionBuilder } from "@arkecosystem/crypto";
import { Address, PublicKey } from "@arkecosystem/crypto";
import pokemon from "pokemon";
import { secrets } from "../utils/config/testnet/delegates.json";

const defaultPassphrase: string = secrets[0];

interface PassphrasePair {
    passphrase: string;
    secondPassphrase: string;
}

export class TransactionFactory {
    public static transfer(recipientId?: string, amount: number = 2, vendorField?: string): TransactionFactory {
        const builder = transactionBuilder
            .transfer()
            .amount(amount)
            .recipientId(recipientId || Address.fromPassphrase(defaultPassphrase));

        if (vendorField) {
            builder.vendorField(vendorField);
        }

        return new TransactionFactory(builder);
    }

    public static secondSignature(secondPassphrase?: string): TransactionFactory {
        return new TransactionFactory(
            transactionBuilder.secondSignature().signatureAsset(secondPassphrase || defaultPassphrase),
        );
    }

    public static delegateRegistration(username?: string): TransactionFactory {
        return new TransactionFactory(transactionBuilder.delegateRegistration().usernameAsset(username));
    }

    public static vote(publicKey?: string): TransactionFactory {
        return new TransactionFactory(
            transactionBuilder.vote().votesAsset([`+${publicKey || PublicKey.fromPassphrase(defaultPassphrase)}`]),
        );
    }

    public static unvote(publicKey?: string): TransactionFactory {
        return new TransactionFactory(
            transactionBuilder.vote().votesAsset([`-${publicKey || PublicKey.fromPassphrase(defaultPassphrase)}`]),
        );
    }

    private builder: any;
    private network: NetworkName = "testnet";
    private fee: number;
    private milestone: Record<string, any>;
    private passphrase: string = defaultPassphrase;
    private secondPassphrase: string;
    private passphraseList: string[];
    private passphrasePairs: PassphrasePair[];

    public constructor(builder) {
        this.builder = builder;
    }

    public withFee(fee: number): TransactionFactory {
        this.fee = fee;

        return this;
    }

    public withNetwork(network: NetworkName): TransactionFactory {
        this.network = network;

        return this;
    }

    public withHeight(height: number): TransactionFactory {
        this.milestone = configManager.getMilestone(height);

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

    public withPassphrasePair(passphrases: PassphrasePair): TransactionFactory {
        this.passphrase = passphrases.passphrase;
        this.secondPassphrase = passphrases.secondPassphrase;

        return this;
    }

    public withPassphrasePairs(passphrases: PassphrasePair[]): TransactionFactory {
        this.passphrasePairs = passphrases;

        return this;
    }

    public create(quantity: number = 1): ITransactionData[] {
        return this.make<ITransactionData>(quantity, "getStruct");
    }

    public build(quantity: number = 1): Transaction[] {
        return this.make<Transaction>(quantity, "build");
    }

    private make<T>(quantity: number = 1, method: string): T[] {
        if (this.passphrasePairs && this.passphrasePairs.length) {
            return this.passphrasePairs.map(
                (passphrasePair: PassphrasePair) =>
                    this.withPassphrase(passphrasePair.passphrase)
                        .withSecondPassphrase(passphrasePair.secondPassphrase)
                        .sign<T>(quantity, method)[0],
            );
        }

        if (this.passphraseList && this.passphraseList.length) {
            return this.passphraseList.map(
                (passphrase: string) => this.withPassphrase(passphrase).sign<T>(quantity, method)[0],
            );
        }

        return this.sign<T>(quantity, method);
    }

    private sign<T>(quantity: number, method: string): T[] {
        configManager.setFromPreset(this.network);

        const transactions: T[] = [];

        for (let i = 0; i < quantity; i++) {
            if (this.builder.constructor.name === "TransferBuilder") {
                // @FIXME: when we use any of the "withPassphrase*" methods the builder will
                // always remember the previous vendor field instead generating a new one on each iteration
                if (!this.builder.data.vendorField) {
                    this.builder.vendorField(`Test Transaction ${i + 1}`);
                }
            }

            if (this.builder.constructor.name === "DelegateRegistrationBuilder") {
                // @FIXME: when we use any of the "withPassphrase*" methods the builder will
                // always remember the previous username instead generating a new one on each iteration
                if (!this.builder.data.asset.delegate.username) {
                    this.builder = transactionBuilder.delegateRegistration().usernameAsset(this.getRandomUsername());
                }
            }

            if (this.fee) {
                this.builder.fee(this.fee);
            }

            this.builder.sign(this.passphrase);

            if (this.secondPassphrase) {
                this.builder.secondSign(this.secondPassphrase);
            }

            transactions.push(this.builder[method]());
        }

        return transactions;
    }

    private getRandomUsername(): string {
        return pokemon
            .random()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .substring(0, 20);
    }
}
