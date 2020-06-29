import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions } from "@arkecosystem/crypto";

import { One } from "../index";

@Container.injectable()
export class SecondSignatureRegistrationTransactionHandler extends One.SecondSignatureRegistrationTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.SecondSignatureRegistrationTransaction;
    }

    public async bootstrap(): Promise<void> {
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        await this.transactionHistoryService.streamManyByCriteria(criteria, (transaction) => {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<string>(transaction.asset?.signature?.publicKey);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            wallet.setAttribute("secondPublicKey", transaction.asset.signature.publicKey);
        });
    }
}
