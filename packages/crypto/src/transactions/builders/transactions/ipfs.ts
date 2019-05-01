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
        this.data.vendorFieldHex = undefined;
        this.data.senderPublicKey = undefined;
        this.data.asset = {};
    }

    public ipfsHash(ipfsHash: string): IPFSBuilder {
        this.data.ipfsHash = ipfsHash;
        return this;
    }

    public vendorField(type: string): IPFSBuilder {
        this.data.vendorFieldHex = Buffer.from(this.data.ipfsHash).toString("hex");

        while (this.data.vendorFieldHex.length < 128) {
            this.data.vendorFieldHex = `00${this.data.vendorFieldHex}`;
        }

        // TODO is this right? when is vendorFieldHex.length is odd,
        // it will add 1 more "0" than previous way
        // const vendorFieldHex = Buffer.from(this.data.ipfsHash, type).toString('hex')
        // this.data.vendorFieldHex = vendorFieldHex.padStart(128, '0')

        return this;
    }

    public dag(dag: string): IPFSBuilder {
        this.data.asset = {
            ipfs: {
                dag,
            },
        };

        return this;
    }

    public getStruct(): ITransactionData {
        const struct: ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.vendorFieldHex = this.data.vendorFieldHex;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): IPFSBuilder {
        return this;
    }
}
