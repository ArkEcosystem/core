import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { IBusinessRegistrationAsset } from "../interfaces";
import { BusinessRegistrationTransaction } from "../transactions";

export class BusinessRegistrationBuilder<
    T,
    U extends Interfaces.ITransactionData,
    E
> extends Transactions.TransactionBuilder<T, BusinessRegistrationBuilder<T, U, E>, U, E> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionFactory: Transactions.TransactionFactory<T, U, E>,
        transactionTools: Transactions.TransactionTools<T, U, E>,
    ) {
        super(cryptoManager, transactionTools, transactionFactory);
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BusinessRegistration;
        this.data.fee = BusinessRegistrationTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.asset = { businessRegistration: {} };
    }

    public businessRegistrationAsset(businessAsset: IBusinessRegistrationAsset): BusinessRegistrationBuilder<T, U, E> {
        if (this.data.asset && this.data.asset.businessRegistration) {
            this.data.asset.businessRegistration = {
                ...businessAsset,
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

    protected instance(): BusinessRegistrationBuilder<T, U, E> {
        return this;
    }
}
