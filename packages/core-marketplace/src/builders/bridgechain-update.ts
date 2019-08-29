import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MarketplaceTransactionGroup, MarketplaceTransactionType } from "../enums";
import { IBridgechainUpdateAsset } from "../interfaces";
import { BridgechainUpdateTransaction } from "../transactions";

export class BridgechainUpdateBuilder extends Transactions.TransactionBuilder<BridgechainUpdateBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MarketplaceTransactionGroup;
        this.data.type = MarketplaceTransactionType.BridgechainUpdate;
        this.data.fee = BridgechainUpdateTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { bridgechainUpdate: {} };
    }

    public bridgechainUpdateAsset(bridgechainUpdateAsset: IBridgechainUpdateAsset): BridgechainUpdateBuilder {
        this.data.asset.bridgechainUpdate = {
            bridgechainId: bridgechainUpdateAsset.bridgechainId,
            seedNodes: bridgechainUpdateAsset.seedNodes,
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
