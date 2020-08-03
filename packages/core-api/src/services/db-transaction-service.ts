import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";

import { TransactionCriteria, TransactionCriteriaItem } from "./transaction-resource";

const {
    getCriteriasExpression,
    getCriteriaExpression,
    getObjectCriteriaItemExpression,
    getEqualExpression,
    getLikeExpression,
    getContainsExpression,
    getNumericExpression,
} = AppUtils.Search;

@Container.injectable()
export class DbTransactionProvider {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-api")
    protected readonly apiConfiguration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionRepository)
    private readonly transactionRepository!: Contracts.Database.TransactionRepository;

    public getTransaction(
        ...criterias: TransactionCriteria[]
    ): Promise<Contracts.Database.TransactionModel | undefined> {
        return this.transactionRepository.getTransaction(this.getCriteriasExpression(criterias));
    }

    public getTransactions(
        ordering: Contracts.Search.Ordering,
        ...criterias: TransactionCriteria[]
    ): Promise<Contracts.Database.TransactionModel[]> {
        return this.transactionRepository.getTransactions(ordering, this.getCriteriasExpression(criterias));
    }

    public getTransactionsStream(
        ordering: Contracts.Search.Ordering,
        ...criterias: TransactionCriteria[]
    ): AsyncIterable<Contracts.Database.TransactionModel> {
        return this.transactionRepository.getTransactionsStream(ordering, this.getCriteriasExpression(criterias));
    }

    public getTransactionsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: TransactionCriteria[]
    ): Promise<Contracts.Database.TransactionsPage> {
        const estimateTotalCount = this.apiConfiguration.getOptional<boolean>("options.estimateTotalCount", true);
        const options = { estimateTotalCount };

        return this.transactionRepository.getTransactionsPage(
            options,
            pagination,
            ordering,
            this.getCriteriasExpression(criterias),
        );
    }

    private getCriteriasExpression(criterias: TransactionCriteria[]): Contracts.Database.TransactionExpression {
        return getCriteriasExpression(criterias, (criteria) => {
            return getCriteriaExpression(criteria, (criteriaItem) => {
                const mainExpression = getObjectCriteriaItemExpression(criteriaItem, (property) => {
                    switch (property) {
                        case "sequence":
                        case "timestamp":
                        case "nonce":
                        case "amount":
                        case "fee":
                            return getNumericExpression(property, criteriaItem[property]!);
                        case "id":
                        case "version":
                        case "blockId":
                        case "senderPublicKey":
                        case "type":
                        case "typeGroup":
                            return getEqualExpression(property, criteriaItem[property]!);
                        case "vendorField":
                            return getLikeExpression(property, criteriaItem[property]!);
                        case "asset":
                            return getContainsExpression(property, criteriaItem[property]!);
                        case "address":
                            return this.getAddressExpression(criteriaItem[property]!);
                        case "senderId":
                            return this.getSenderIdExpression(criteriaItem[property]!);
                        case "recipientId":
                            return this.getRecipientIdExpression(criteriaItem[property]!);
                        default:
                            return { op: "true" };
                    }
                });

                return { op: "and", expressions: [mainExpression, this.getAutoTypeGroupExpression(criteriaItem)] };
            });
        });
    }

    private getAddressExpression(address: string | string[]): Contracts.Database.TransactionExpression {
        return {
            op: "or",
            expressions: [this.getSenderIdExpression(address), this.getRecipientIdExpression(address)],
        };
    }

    private getSenderIdExpression(senderId: string | string[]): Contracts.Database.TransactionExpression {
        return getCriteriaExpression(senderId, (senderIdItem) => {
            if (this.walletRepository.hasByAddress(senderIdItem)) {
                const senderWallet = this.walletRepository.findByAddress(senderIdItem);

                if (senderWallet.publicKey) {
                    return { property: "senderPublicKey", op: "equal", value: senderWallet.publicKey };
                }
            }

            return { op: "false" };
        });
    }

    private getRecipientIdExpression(recipientId: string | string[]): Contracts.Database.TransactionExpression {
        return getCriteriaExpression(recipientId, (recipientIdItem) => {
            const expressions: Contracts.Database.TransactionExpression[] = [];

            expressions.push({
                property: "recipientId",
                op: "equal",
                value: recipientIdItem,
            });

            expressions.push({
                op: "and",
                expressions: [
                    { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core },
                    { property: "type", op: "equal", value: Enums.TransactionType.MultiPayment },
                    { property: "asset", op: "contains", value: { payments: [{ recipientId: recipientIdItem }] } },
                ],
            });

            if (this.walletRepository.hasByAddress(recipientIdItem)) {
                const recipientWallet = this.walletRepository.findByAddress(recipientIdItem);

                if (recipientWallet.publicKey) {
                    expressions.push({
                        op: "and",
                        expressions: [
                            { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core },
                            { property: "type", op: "equal", value: Enums.TransactionType.DelegateRegistration },
                            { property: "senderPublicKey", op: "equal", value: recipientWallet.publicKey },
                        ],
                    });
                }
            }

            return { op: "or", expressions };
        });
    }

    private getAutoTypeGroupExpression(
        criteriaItem: TransactionCriteriaItem,
    ): Contracts.Database.TransactionExpression {
        if ("type" in criteriaItem && "typeGroup" in criteriaItem === false) {
            return { property: "typeGroup", op: "equal", value: Enums.TransactionTypeGroup.Core };
        } else {
            return { op: "true" };
        }
    }
}
