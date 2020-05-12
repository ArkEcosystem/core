import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { IBusinessUpdateAsset } from "../interfaces";
import { BusinessUpdateTransaction } from "../transactions";

export class BusinessUpdateBuilder<T, U extends Interfaces.ITransactionData, E> extends Transactions.TransactionBuilder<
    T,
    BusinessUpdateBuilder<T, U, E>,
    U,
    E
> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionsManager: Transactions.TransactionsManager<T, U, E>,
    ) {
        super(cryptoManager, transactionsManager);
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BusinessUpdate;
        this.data.fee = BusinessUpdateTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.asset = { businessUpdate: {} };
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    public businessUpdateAsset(businessAsset: IBusinessUpdateAsset): BusinessUpdateBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.businessUpdate) {
            this.data.asset.businessUpdate = {
                ...businessAsset,
            };
        }

        return this;
    }

    protected instance(): BusinessUpdateBuilder<T, U, E> {
        return this;
    }
}
