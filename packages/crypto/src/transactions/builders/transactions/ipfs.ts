import { CryptoManager } from "../../../crypto-manager";
import { ITransactionData } from "../../../interfaces";
import { TransactionFactory } from "../../factory";
import { Signer } from "../../signer";
import { Two } from "../../types";
import { Utils } from "../../utils";
import { Verifier } from "../../verifier";
import { TransactionBuilder } from "./transaction";

export class IPFSBuilder<T, U extends ITransactionData, E> extends TransactionBuilder<T, U, E, IPFSBuilder<T, U, E>> {
    public constructor(
        cryptoManager: CryptoManager<T>,
        transactionFactory: TransactionFactory<T, U, E>,
        signer: Signer<T, U, E>,
        verifier: Verifier<T, U, E>,
        utils: Utils<T, U, E>,
    ) {
        super(cryptoManager, transactionFactory, signer, verifier, utils);

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
