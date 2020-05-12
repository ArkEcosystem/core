import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { BusinessResignationTransaction } from "../transactions";

export class BusinessResignationBuilder<
    T,
    U extends Interfaces.ITransactionData,
    E
> extends Transactions.TransactionBuilder<T, BusinessResignationBuilder<T, U, E>, U, E> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionsManager: Transactions.TransactionsManager<T, U, E>,
    ) {
        super(cryptoManager, transactionsManager);
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BusinessResignation;
        this.data.fee = BusinessResignationTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.asset = { businessResignation: {} };
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BusinessResignationBuilder<T, U, E> {
        return this;
    }
}
