import { configManager, constants, ITransactionData, NetworkName, transactionBuilder } from "@arkecosystem/crypto";
import { Address, PublicKey } from "@arkecosystem/crypto";
import pokemon from "pokemon";
import { secrets } from "../utils/config/testnet/delegates.json";

const defaultPassphrase: string = secrets[0];

export class TransactionFactory {
    public static transfer(recipientId?: string, amount: number = 2, vendorField?: string): TransactionFactory {
        const builder = transactionBuilder
            .transfer()
            .amount(amount * constants.SATOSHI)
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
        return new TransactionFactory(
            transactionBuilder.delegateRegistration().usernameAsset(username || pokemon.random()),
        );
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

    public withPassphrases(passphrases: { passphrase: string; secondPassphrase: string }): TransactionFactory {
        this.passphrase = passphrases.passphrase;
        this.secondPassphrase = passphrases.secondPassphrase;

        return this;
    }

    public create(quantity: number = 1): ITransactionData[] {
        configManager.setFromPreset(this.network);

        const transactions: ITransactionData[] = [];

        for (let i = 0; i < quantity; i++) {
            if (this.fee) {
                this.builder.fee(this.fee);
            }

            this.builder.sign(this.passphrase);

            if (this.secondPassphrase) {
                this.builder.secondSign(this.secondPassphrase);
            }

            transactions.push(this.builder.getStruct());
        }

        return transactions;
    }
}
