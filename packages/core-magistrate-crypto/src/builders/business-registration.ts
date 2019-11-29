import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { IBusinessRegistrationAsset } from "../interfaces";
import { BusinessRegistrationTransaction } from "../transactions";

export class BusinessRegistrationBuilder extends Transactions.TransactionBuilder<BusinessRegistrationBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BusinessRegistration;
        this.data.fee = BusinessRegistrationTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { businessRegistration: {} };
    }

    public businessRegistrationAsset(businessAsset: IBusinessRegistrationAsset): BusinessRegistrationBuilder {
        this.data.asset.businessRegistration = {
            ...businessAsset,
        };
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BusinessRegistrationBuilder {
        return this;
    }
}
