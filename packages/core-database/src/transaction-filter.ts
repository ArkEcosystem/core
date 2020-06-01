import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";

import { Transaction } from "./models/transaction";

const {
    handleAndCriteria,
    handleOrCriteria,
    handleNumericCriteria,
    optimizeExpression,
    hasOrCriteria,
} = AppUtils.Search;

@Container.injectable()
export class TransactionFilter implements Contracts.Database.TransactionFilter {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public async getExpression(
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Contracts.Search.Expression<Transaction>> {
        const expression = await handleOrCriteria(criteria, (c) => {
            return this.handleTransactionCriteria(c);
        });

        return optimizeExpression(expression);
    }

    private async handleTransactionCriteria(
        criteria: Contracts.Shared.TransactionCriteria,
    ): Promise<Contracts.Search.Expression<Transaction>> {
        const expression: Contracts.Search.Expression<Transaction> = await handleAndCriteria(criteria, async (key) => {
            switch (key) {
                case "address":
                    return handleOrCriteria(criteria.address!, async (c) => {
                        return this.handleAddressCriteria(c);
                    });
                case "senderId":
                    return handleOrCriteria(criteria.senderId!, async (c) => {
                        return this.handleSenderIdCriteria(c);
                    });
                case "recipientId":
                    return handleOrCriteria(criteria.recipientId!, (c) => {
                        return this.handleRecipientIdCriteria(c);
                    });
                case "id":
                    return handleOrCriteria(criteria.id!, async (c) => {
                        return { property: "id", op: "equal", value: c };
                    });
                case "version":
                    return handleOrCriteria(criteria.version!, async (c) => {
                        return { property: "version", op: "equal", value: c };
                    });
                case "blockId":
                    return handleOrCriteria(criteria.blockId!, async (c) => {
                        return { property: "blockId", op: "equal", value: c };
                    });
                case "sequence":
                    return handleOrCriteria(criteria.sequence!, async (c) => {
                        return handleNumericCriteria("sequence", c);
                    });
                case "timestamp":
                    return handleOrCriteria(criteria.timestamp!, async (c) => {
                        return handleNumericCriteria("timestamp", c);
                    });
                case "nonce":
                    return handleOrCriteria(criteria.nonce!, async (c) => {
                        return handleNumericCriteria("nonce", c);
                    });
                case "senderPublicKey":
                    return handleOrCriteria(criteria.senderPublicKey!, async (c) => {
                        return { property: "senderPublicKey", op: "equal", value: c };
                    });
                case "type":
                    return handleOrCriteria(criteria.type!, async (c) => {
                        return { property: "type", op: "equal", value: c };
                    });
                case "typeGroup":
                    return handleOrCriteria(criteria.typeGroup!, async (c) => {
                        return { property: "typeGroup", op: "equal", value: c };
                    });
                case "vendorField":
                    return handleOrCriteria(criteria.vendorField!, async (c) => {
                        return { property: "vendorField", op: "like", pattern: c };
                    });
                case "amount":
                    return handleOrCriteria(criteria.amount!, async (c) => {
                        return handleNumericCriteria("amount", c);
                    });
                case "fee":
                    return handleOrCriteria(criteria.fee!, async (c) => {
                        return handleNumericCriteria("fee", c);
                    });
                case "asset":
                    return handleOrCriteria(criteria.asset!, async (c) => {
                        return { property: "asset", op: "contains", value: c };
                    });
                default:
                    return { op: "true" };
            }
        });

        return { op: "and", expressions: [expression, await this.getAutoTypeGroupExpression(criteria)] };
    }

    private async handleAddressCriteria(
        criteria: Contracts.Search.EqualCriteria<string>,
    ): Promise<Contracts.Search.Expression<Transaction>> {
        const expressions: Contracts.Search.Expression<Transaction>[] = await Promise.all([
            this.handleSenderIdCriteria(criteria),
            this.handleRecipientIdCriteria(criteria),
        ]);

        return { op: "or", expressions };
    }

    private async handleSenderIdCriteria(
        criteria: Contracts.Search.EqualCriteria<string>,
    ): Promise<Contracts.Search.Expression<Transaction>> {
        const senderWallet = this.walletRepository.findByAddress(criteria);

        if (senderWallet && senderWallet.publicKey) {
            return { op: "equal", property: "senderPublicKey", value: senderWallet.publicKey };
        } else {
            return { op: "false" };
        }
    }

    private async handleRecipientIdCriteria(
        criteria: Contracts.Search.EqualCriteria<string>,
    ): Promise<Contracts.Search.Expression<Transaction>> {
        const recipientIdExpression: Contracts.Search.EqualExpression<Transaction> = {
            op: "equal",
            property: "recipientId" as keyof Transaction,
            value: criteria,
        };

        const multipaymentRecipientIdExpression: Contracts.Search.AndExpression<Transaction> = {
            op: "and",
            expressions: [
                { op: "equal", property: "typeGroup", value: Enums.TransactionTypeGroup.Core },
                { op: "equal", property: "type", value: Enums.TransactionType.MultiPayment },
                { op: "contains", property: "asset", value: { payment: [{ recipientId: criteria }] } },
            ],
        };

        const recipientWallet = this.walletRepository.findByAddress(criteria);
        if (recipientWallet && recipientWallet.publicKey) {
            const delegateRegistrationExpression: Contracts.Search.AndExpression<Transaction> = {
                op: "and",
                expressions: [
                    { op: "equal", property: "typeGroup", value: Enums.TransactionTypeGroup.Core },
                    { op: "equal", property: "type", value: Enums.TransactionType.DelegateRegistration },
                    { op: "equal", property: "senderPublicKey", value: recipientWallet.publicKey },
                ],
            };

            return {
                op: "or",
                expressions: [recipientIdExpression, multipaymentRecipientIdExpression, delegateRegistrationExpression],
            };
        } else {
            return {
                op: "or",
                expressions: [recipientIdExpression, multipaymentRecipientIdExpression],
            };
        }
    }

    private async getAutoTypeGroupExpression(
        criteria: Contracts.Shared.TransactionCriteria,
    ): Promise<Contracts.Search.Expression<Transaction>> {
        if (hasOrCriteria(criteria.type) && hasOrCriteria(criteria.typeGroup) === false) {
            return { op: "equal", property: "typeGroup", value: Enums.TransactionTypeGroup.Core };
        } else {
            return { op: "true" };
        }
    }
}
