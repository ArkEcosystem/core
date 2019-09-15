import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MarketplaceTransactionGroup, MarketplaceTransactionType } from "../enums";
import { IBridgechainRegistrationAsset } from "../interfaces";
import { BridgechainRegistrationTransaction } from "../transactions";

export class BridgechainRegistrationBuilder extends Transactions.TransactionBuilder<BridgechainRegistrationBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MarketplaceTransactionGroup;
        this.data.type = MarketplaceTransactionType.BridgechainRegistration;
        this.data.fee = BridgechainRegistrationTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { bridgechainRegistration: {} };
    }

    public bridgechainRegistrationAsset(
        bridgechainAsset: IBridgechainRegistrationAsset,
    ): BridgechainRegistrationBuilder {
        this.data.asset.bridgechainRegistration = {
            name: bridgechainAsset.name,
            seedNodes: bridgechainAsset.seedNodes,
            genesisHash: bridgechainAsset.genesisHash,
            bridgechainRepository: bridgechainAsset.bridgechainRepository,
        };
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BridgechainRegistrationBuilder {
        return this;
    }
}
