import { TransactionTypes } from "../../../enums";
import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../utils";
import { IpfsTransaction } from "../../types";
import { TransactionBuilder } from "./transaction";

export class IPFSBuilder extends TransactionBuilder<IPFSBuilder> {
    constructor() {
        super();

        this.data.type = TransactionTypes.Ipfs;
        this.data.fee = IpfsTransaction.staticFee();
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
