import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MarketplaceTransactionsGroup, MarketplaceTransactionTypes } from "../marketplace-transactions";
import { BridgechainResignationTransaction } from "../transactions";

const bridgechainResignationType: number = MarketplaceTransactionTypes.BridgechainResignation;

export class BridgechainResignationBuilder extends Transactions.TransactionBuilder<BridgechainResignationBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MarketplaceTransactionsGroup;
        this.data.type = bridgechainResignationType;
        this.data.fee = BridgechainResignationTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { bridgechainResignation: {} };
    }

    public businessResignationAsset(registeredBridgechainId: string): BridgechainResignationBuilder {
        this.data.asset.bridgechainResignation = {
            registeredBridgechainId,
        };
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BridgechainResignationBuilder {
        return this;
    }
}
