import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { IEntityAsset } from "../interfaces";
import { EntityTransaction } from "../transactions";

export class EntityBuilder<T, U extends Interfaces.ITransactionData, E> extends Transactions.TransactionBuilder<
    T,
    EntityBuilder<T, U, E>,
    U,
    E
> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionFactory: Transactions.TransactionFactory<T, U, E>,
        transactionTools: Transactions.TransactionTools<T, U, E>,
    ) {
        super(cryptoManager, transactionTools, transactionFactory);
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.Entity;
        this.data.fee = EntityTransaction.staticFee(cryptoManager);
        this.data.amount = this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.asset = {};
    }

    public asset(asset: IEntityAsset): EntityBuilder<T, U, E> {
        this.data.asset = asset;

        return this;
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): EntityBuilder<T, U, E> {
        return this;
    }
}
