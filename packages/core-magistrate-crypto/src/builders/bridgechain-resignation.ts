import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { BridgechainResignationTransaction } from "../transactions";

export class BridgechainResignationBuilder<
    T,
    U extends Interfaces.ITransactionData,
    E
> extends Transactions.TransactionBuilder<T, BridgechainResignationBuilder<T, U, E>, U, E> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionsManager: Transactions.TransactionsManager<T, U, E>,
    ) {
        super(cryptoManager, transactionsManager);
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BridgechainResignation;
        this.data.fee = BridgechainResignationTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.asset = { bridgechainResignation: {} };
    }

    public bridgechainResignationAsset(bridgechainId: string): BridgechainResignationBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.bridgechainResignation) {
            this.data.asset.bridgechainResignation.bridgechainId = bridgechainId;
        }

        return this;
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BridgechainResignationBuilder<T, U, E> {
        return this;
    }
}
