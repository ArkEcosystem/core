import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MagistrateTransactionGroup, MagistrateTransactionType } from "../enums";
import { BridgechainResignationTransaction } from "../transactions";

export class BridgechainResignationBuilder extends Transactions.TransactionBuilder<BridgechainResignationBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MagistrateTransactionGroup;
        this.data.type = MagistrateTransactionType.BridgechainResignation;
        this.data.fee = BridgechainResignationTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { bridgechainResignation: {} };
    }

    public bridgechainResignationAsset(bridgechainId: string): BridgechainResignationBuilder {
        this.data.asset.bridgechainResignation.bridgechainId = bridgechainId;
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
