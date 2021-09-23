import { ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class VoteBuilder extends TransactionBuilder<VoteBuilder> {
    constructor();
    votesAsset(votes: string[]): VoteBuilder;
    getStruct(): ITransactionData;
    protected instance(): VoteBuilder;
}
