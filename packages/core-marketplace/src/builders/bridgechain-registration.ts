import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { IBridgechainRegistrationAsset } from "../interfaces";
import { MarketplaceTransactionTypes } from "../marketplace-transactions";
import { BridgechainRegistrationTransaction } from "../transactions";

const bridgechainRegistrationType: number = MarketplaceTransactionTypes.BridgechainRegistration;

export class BridgechainRegistrationBuilder extends Transactions.TransactionBuilder<BridgechainRegistrationBuilder> {
    constructor() {
        super();
        this.data.type = bridgechainRegistrationType;
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
            githubRepository: bridgechainAsset.githubRepository,
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
