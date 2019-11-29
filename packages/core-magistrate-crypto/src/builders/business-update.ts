import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { IBusinessUpdateAsset } from "../interfaces";
import { BusinessUpdateTransaction } from "../transactions";

export class BusinessUpdateBuilder extends Transactions.TransactionBuilder<BusinessUpdateBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BusinessUpdate;
        this.data.fee = BusinessUpdateTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { businessUpdate: {} };
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    public businessUpdateAsset(businessAsset: IBusinessUpdateAsset): BusinessUpdateBuilder {
        this.data.asset.businessUpdate = {
            ...businessAsset,
        };
        return this;
    }

    protected instance(): BusinessUpdateBuilder {
        return this;
    }
}
