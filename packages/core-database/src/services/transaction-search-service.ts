import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";

import { Transaction } from "../models";
import { TransactionRepository } from "../repositories";

const {
    hasOrCriteria,
    equalExpression,
    containsExpression,
    andExpression,
    orExpression,
    createAndFilter,
    createOrFilter,
    createValueFilter,
    createNumericFilter,
} = Contracts.Database;

@Container.injectable()
export class TransactionSearchService implements Contracts.Database.TransactionSearchService {
    @Container.inject(Container.Identifiers.TransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    private readonly filter = createAndFilter<Transaction, Contracts.Database.TransactionCriteria>({
        wallet: createOrFilter(this.walletFilter.bind(this)),
        senderId: createOrFilter(this.senderIdFilter.bind(this)),

        id: createOrFilter(createValueFilter(Transaction, "id")),
        version: createOrFilter(createValueFilter(Transaction, "version")),
        blockId: createOrFilter(createValueFilter(Transaction, "blockId")),
        sequence: createOrFilter(createNumericFilter(Transaction, "sequence")),
        timestamp: createOrFilter(createNumericFilter(Transaction, "timestamp")),
        nonce: createOrFilter(createNumericFilter(Transaction, "nonce")),
        senderPublicKey: createOrFilter(createValueFilter(Transaction, "senderPublicKey")),
        recipientId: createOrFilter(this.recipientIdFilter.bind(this)),
        type: createOrFilter(createValueFilter(Transaction, "type")),
        typeGroup: createOrFilter(createValueFilter(Transaction, "typeGroup")),
        vendorField: createOrFilter(createValueFilter(Transaction, "vendorField")),
        amount: createOrFilter(createValueFilter(Transaction, "amount")),
        fee: createOrFilter(createValueFilter(Transaction, "fee")),
        asset: createOrFilter(createValueFilter(Transaction, "asset")),
    });

    public async search(
        criteria: Contracts.Database.TransactionCriteria,
        order: Contracts.Database.SearchOrder<Transaction>,
        page: Contracts.Database.SearchPage,
    ): Promise<Contracts.Database.SearchResult<Transaction>> {
        const expressions = [await this.filter(criteria)];

        if ("type" in criteria && hasOrCriteria(criteria.type)) {
            if ("typeGroup" in criteria === false || hasOrCriteria(criteria.typeGroup) === false) {
                const autoTypeGroupExpression = equalExpression(
                    Transaction,
                    "typeGroup",
                    Enums.TransactionTypeGroup.Core,
                );
                expressions.push(autoTypeGroupExpression);
            }
        }

        return this.transactionRepository.search(andExpression(expressions), order, page);
    }

    private async walletFilter(
        criteria: Contracts.Database.TransactionWalletCriteria,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        const recipientIdExpression = equalExpression(Transaction, "recipientId", criteria.address);
        const assetExpression = containsExpression(Transaction, "asset", {
            payment: [{ recipientId: criteria.address }],
        });

        if (criteria.publicKey) {
            const senderPublicKeyExpression = equalExpression(Transaction, "senderPublicKey", criteria.publicKey);
            return orExpression([recipientIdExpression, assetExpression, senderPublicKeyExpression]);
        } else {
            return orExpression([recipientIdExpression, assetExpression]);
        }
    }

    private async recipientIdFilter(address: string): Promise<Contracts.Database.Expression<Transaction>> {
        const recipientIdExpression = equalExpression(Transaction, "recipientId", address);

        const recipientWallet = this.walletRepository.findByAddress(address);
        if (recipientWallet) {
            const senderPublicKeyExpression = andExpression([
                equalExpression(Transaction, "typeGroup", Enums.TransactionTypeGroup.Core),
                equalExpression(Transaction, "type", Enums.TransactionType.DelegateRegistration),
                equalExpression(Transaction, "senderPublicKey", recipientWallet.publicKey),
            ]);

            return orExpression([recipientIdExpression, senderPublicKeyExpression]);
        } else {
            return recipientIdExpression;
        }
    }

    private async senderIdFilter(address: string): Promise<Contracts.Database.Expression<Transaction>> {
        const senderWallet = this.walletRepository.findByAddress(address);
        return equalExpression(Transaction, "senderPublicKey", senderWallet.publicKey);
    }
}
