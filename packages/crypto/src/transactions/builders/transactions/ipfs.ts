import { TransactionTypes } from "../../../enums";
import { ITransactionData } from "../../../interfaces";
import { feeManager } from "../../../managers";
import { BigNumber } from "../../../utils";
import { TransactionBuilder } from "./transaction";

export class IPFSBuilder extends TransactionBuilder<IPFSBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.Ipfs;
        this.data.fee = feeManager.get(TransactionTypes.Ipfs);
        this.data.amount = BigNumber.ZERO;
        this.data.asset = {};
    }

    public ipfsAsset(ipfsId: string): IPFSBuilder {
        this.data.asset = {
            ipfs: ipfsId,
        };

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): IPFSBuilder {
        return this;
    }
}
