import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { IBridgechainUpdateAsset } from "../interfaces";
export declare class BridgechainUpdateBuilder extends Transactions.TransactionBuilder<BridgechainUpdateBuilder> {
    constructor();
    bridgechainUpdateAsset(bridgechainUpdateAsset: IBridgechainUpdateAsset): BridgechainUpdateBuilder;
    getStruct(): Interfaces.ITransactionData;
    protected instance(): BridgechainUpdateBuilder;
}
