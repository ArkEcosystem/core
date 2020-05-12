import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { IBridgechainUpdateAsset } from "../interfaces";
import { BridgechainUpdateTransaction } from "../transactions";

export class BridgechainUpdateBuilder<
    T,
    U extends Interfaces.ITransactionData,
    E
> extends Transactions.TransactionBuilder<T, BridgechainUpdateBuilder<T, U, E>, U, E> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionsManager: Transactions.TransactionsManager<T, U, E>,
    ) {
        super(cryptoManager, transactionsManager);
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BridgechainUpdate;
        this.data.fee = BridgechainUpdateTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.asset = { bridgechainUpdate: {} };
    }

    public bridgechainUpdateAsset(bridgechainUpdateAsset: IBridgechainUpdateAsset): BridgechainUpdateBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.bridgechainUpdate) {
            this.data.asset.bridgechainUpdate = {
                ...bridgechainUpdateAsset,
            };
        }

        return this;
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BridgechainUpdateBuilder<T, U, E> {
        return this;
    }
}
