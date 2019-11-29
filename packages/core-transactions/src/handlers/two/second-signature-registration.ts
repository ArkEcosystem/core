import { Models } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import { Transactions } from "@arkecosystem/crypto";

import { TransactionReader } from "../../transaction-reader";
import { One } from "../index";

@Container.injectable()
export class SecondSignatureRegistrationTransactionHandler extends One.SecondSignatureRegistrationTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.SecondSignatureRegistrationTransaction;
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            wallet.setAttribute("secondPublicKey", transaction.asset.signature!.publicKey);
        }
    }
}
