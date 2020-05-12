import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { IBridgechainRegistrationAsset } from "../interfaces";
import { BridgechainRegistrationTransaction } from "../transactions";

export class BridgechainRegistrationBuilder<
    T,
    U extends Interfaces.ITransactionData,
    E
> extends Transactions.TransactionBuilder<T, BridgechainRegistrationBuilder<T, U, E>, U, E> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionsManager: Transactions.TransactionsManager<T, U, E>,
    ) {
        super(cryptoManager, transactionsManager);
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BridgechainRegistration;
        this.data.fee = BridgechainRegistrationTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.asset = { bridgechainRegistration: {} };
    }

    public bridgechainRegistrationAsset(
        bridgechainAsset: IBridgechainRegistrationAsset,
    ): BridgechainRegistrationBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.bridgechainRegistration) {
            this.data.asset.bridgechainRegistration = bridgechainAsset;
        }

        return this;
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BridgechainRegistrationBuilder<T, U, E> {
        return this;
    }
}
