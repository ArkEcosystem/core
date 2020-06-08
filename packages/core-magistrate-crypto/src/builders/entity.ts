import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { IEntityAsset } from "../interfaces";
import { EntityTransaction } from "../transactions";

export class EntityBuilder extends Transactions.TransactionBuilder<EntityBuilder> {
    public constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.Entity;
        this.data.fee = EntityTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = {};
    }

    public asset(asset: IEntityAsset): EntityBuilder {
        this.data.asset = asset;

        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): EntityBuilder {
        return this;
    }
}
