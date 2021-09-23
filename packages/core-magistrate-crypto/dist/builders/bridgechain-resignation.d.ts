import { Interfaces, Transactions } from "@arkecosystem/crypto";
export declare class BridgechainResignationBuilder extends Transactions.TransactionBuilder<BridgechainResignationBuilder> {
    constructor();
    bridgechainResignationAsset(bridgechainId: string): BridgechainResignationBuilder;
    getStruct(): Interfaces.ITransactionData;
    protected instance(): BridgechainResignationBuilder;
}
