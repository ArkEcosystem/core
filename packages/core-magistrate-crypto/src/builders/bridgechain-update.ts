import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { IBridgechainUpdateAsset } from "../interfaces";
import { BridgechainUpdateTransaction } from "../transactions";

export class BridgechainUpdateBuilder extends Transactions.TransactionBuilder<BridgechainUpdateBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BridgechainUpdate;
        this.data.fee = BridgechainUpdateTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { bridgechainUpdate: {} };
    }

    public bridgechainUpdateAsset(bridgechainUpdateAsset: IBridgechainUpdateAsset): BridgechainUpdateBuilder {
        this.data.asset.bridgechainUpdate = {
            ...bridgechainUpdateAsset,
        };
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BridgechainUpdateBuilder {
        return this;
    }
}
