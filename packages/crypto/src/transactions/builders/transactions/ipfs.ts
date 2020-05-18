import { CryptoManager } from "../../../crypto-manager";
import { ITransactionData, SchemaError } from "../../../interfaces";
import { TransactionTools } from "../../transactions-manager";
import { Two } from "../../types";
import { TransactionBuilder } from "./transaction";

export class IPFSBuilder<T, U extends ITransactionData = ITransactionData, E = SchemaError> extends TransactionBuilder<
    T,
    IPFSBuilder<T, U, E>,
    U,
    E
> {
    public constructor(cryptoManager: CryptoManager<T>, transactionTools: TransactionTools<T, U, E>) {
        super(cryptoManager, transactionTools);
        this.data.type = Two.IpfsTransaction.type;
        this.data.typeGroup = Two.IpfsTransaction.typeGroup;
        this.data.fee = Two.IpfsTransaction.staticFee(cryptoManager);
        this.data.amount = cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        this.data.asset = {};
    }

    public ipfsAsset(ipfsId: string): IPFSBuilder<T, U, E> {
        this.data.asset = {
            ipfs: ipfsId,
        };

        return this;
    }

    public getStruct(): U {
        const struct: U = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): IPFSBuilder<T, U, E> {
        return this;
    }
}
