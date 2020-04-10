import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";

import { Transaction } from "../models";

@Container.injectable()
export class TransactionFilter implements Contracts.Database.TransactionFilter {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    private readonly handler = new Contracts.Database.CriteriaHandler<Transaction>();

    public async getWalletExpression(
        wallet: Contracts.State.Wallet,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        const recipientIdExpression = new Contracts.Database.EqualExpression("recipientId", wallet.address);
        const paymentExpression = new Contracts.Database.ContainsExpression("asset", {
            payment: [{ recipientId: wallet.address }],
        });
        if (wallet.publicKey) {
            const senderPublicKeyExpression = new Contracts.Database.EqualExpression(
                "senderPublicKey",
                wallet.publicKey,
            );

            return Contracts.Database.OrExpression.make([
                recipientIdExpression,
                paymentExpression,
                senderPublicKeyExpression,
            ]);
        }

        return Contracts.Database.OrExpression.make([recipientIdExpression, paymentExpression]);
    }

    public async getCriteriaExpression(
        criteria: Contracts.Database.OrTransactionCriteria,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        return this.handler.handleOrCriteria(criteria, (c) => this.handleTransactionCriteria(c));
    }

    private async handleTransactionCriteria(
        criteria: Contracts.Database.TransactionCriteria,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        const expression = await this.handler.handleAndCriteria(criteria, async (key) => {
            switch (key) {
                case "senderId":
                    return this.handler.handleOrCriteria(criteria.senderId!, (c) => this.handleSenderIdCriteria(c));
                case "id":
                    return this.handler.handleOrEqualCriteria("id", criteria.id!);
                case "version":
                    return this.handler.handleOrEqualCriteria("version", criteria.version!);
                case "blockId":
                    return this.handler.handleOrEqualCriteria("blockId", criteria.blockId!);
                case "sequence":
                    return this.handler.handleOrNumericCriteria("sequence", criteria.sequence!);
                case "timestamp":
                    return this.handler.handleOrNumericCriteria("timestamp", criteria.timestamp!);
                case "nonce":
                    return this.handler.handleOrNumericCriteria("nonce", criteria.nonce!);
                case "senderPublicKey":
                    return this.handler.handleOrEqualCriteria("senderPublicKey", criteria.senderPublicKey!);
                case "recipientId":
                    return this.handler.handleOrCriteria(criteria.recipientId!, (c) =>
                        this.handleRecipientIdCriteria(c),
                    );
                case "type":
                    return this.handler.handleOrEqualCriteria("type", criteria.type!);
                case "typeGroup":
                    return this.handler.handleOrEqualCriteria("typeGroup", criteria.typeGroup!);
                case "vendorField":
                    return this.handler.handleOrLikeCriteria("vendorField", criteria.vendorField!);
                case "amount":
                    return this.handler.handleOrNumericCriteria("amount", criteria.amount!);
                case "fee":
                    return this.handler.handleOrNumericCriteria("fee", criteria.fee!);
                case "asset":
                    return this.handler.handleOrContainsCriteria("asset", criteria.asset!);
                default:
                    return new Contracts.Database.VoidExpression();
            }
        });

        return Contracts.Database.AndExpression.make([expression, await this.getAutoTypeGroupExpression(criteria)]);
    }

    private async handleSenderIdCriteria(
        criteria: Contracts.Database.EqualCriteria<string>,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        const senderWallet = this.walletRepository.findByAddress(criteria);

        if (senderWallet && senderWallet.publicKey) {
            return new Contracts.Database.EqualExpression("senderPublicKey", senderWallet.publicKey);
        } else {
            return new Contracts.Database.FalseExpression();
        }
    }

    private async handleRecipientIdCriteria(
        criteria: Contracts.Database.EqualCriteria<string>,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        const recipientIdExpression = new Contracts.Database.EqualExpression("recipientId", criteria);

        const recipientWallet = this.walletRepository.findByAddress(criteria);
        if (recipientWallet && recipientWallet.publicKey) {
            const senderPublicKeyExpression = Contracts.Database.AndExpression.make([
                new Contracts.Database.EqualExpression("typeGroup", Enums.TransactionTypeGroup.Core),
                new Contracts.Database.EqualExpression("type", Enums.TransactionType.DelegateRegistration),
                new Contracts.Database.EqualExpression("senderPublicKey", recipientWallet.publicKey),
            ]);

            return Contracts.Database.OrExpression.make([recipientIdExpression, senderPublicKeyExpression]);
        } else {
            return recipientIdExpression;
        }
    }

    private async getAutoTypeGroupExpression(
        criteria: Contracts.Database.TransactionCriteria,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        if (this.handler.hasOrCriteria(criteria.type) && this.handler.hasOrCriteria(criteria.typeGroup) === false) {
            return new Contracts.Database.EqualExpression("typeGroup", Enums.TransactionTypeGroup.Core);
        } else {
            return new Contracts.Database.VoidExpression();
        }
    }
}
