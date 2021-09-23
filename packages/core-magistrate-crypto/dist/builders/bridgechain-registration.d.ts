import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { IBridgechainRegistrationAsset } from "../interfaces";
export declare class BridgechainRegistrationBuilder extends Transactions.TransactionBuilder<BridgechainRegistrationBuilder> {
    constructor();
    bridgechainRegistrationAsset(bridgechainAsset: IBridgechainRegistrationAsset): BridgechainRegistrationBuilder;
    getStruct(): Interfaces.ITransactionData;
    protected instance(): BridgechainRegistrationBuilder;
}
