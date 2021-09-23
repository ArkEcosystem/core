import { ITransactionData } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";
export declare class IPFSBuilder extends TransactionBuilder<IPFSBuilder> {
    constructor();
    ipfsAsset(ipfsId: string): IPFSBuilder;
    getStruct(): ITransactionData;
    protected instance(): IPFSBuilder;
}
