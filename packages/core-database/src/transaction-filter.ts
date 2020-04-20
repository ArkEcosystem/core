import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";

import { CriteriaHandler } from "./criteria-handler";
import { Transaction } from "./models/transaction";

@Container.injectable()
export class TransactionFilter implements Contracts.Database.TransactionFilter {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    private readonly handler = new CriteriaHandler<Transaction>();

    public async getWhereExpression(
        criteria: Contracts.Shared.OrTransactionCriteria,
    ): Promise<Contracts.Shared.WhereExpression> {
        return this.handler.handleOrCriteria(criteria, (c) => {
            return this.handleTransactionCriteria(c);
        });
    }

    private async handleTransactionCriteria(
        criteria: Contracts.Shared.TransactionCriteria,
    ): Promise<Contracts.Shared.WhereExpression> {
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
                    return new Contracts.Shared.VoidExpression();
            }
        });

        return Contracts.Shared.AndExpression.make([expression, await this.getAutoTypeGroupExpression(criteria)]);
    }

    private async handleSenderIdCriteria(
        criteria: Contracts.Shared.EqualCriteria<string>,
    ): Promise<Contracts.Shared.WhereExpression> {
        const senderWallet = this.walletRepository.findByAddress(criteria);

        if (senderWallet && senderWallet.publicKey) {
            return new Contracts.Shared.EqualExpression("senderPublicKey", senderWallet.publicKey);
        } else {
            return new Contracts.Shared.FalseExpression();
        }
    }

    private async handleRecipientIdCriteria(
        criteria: Contracts.Shared.EqualCriteria<string>,
    ): Promise<Contracts.Shared.WhereExpression> {
        const recipientIdExpression = new Contracts.Shared.EqualExpression("recipientId", criteria);

        const recipientWallet = this.walletRepository.findByAddress(criteria);
        if (recipientWallet && recipientWallet.publicKey) {
            const senderPublicKeyExpression = Contracts.Shared.AndExpression.make([
                new Contracts.Shared.EqualExpression("typeGroup", Enums.TransactionTypeGroup.Core),
                new Contracts.Shared.EqualExpression("type", Enums.TransactionType.DelegateRegistration),
                new Contracts.Shared.EqualExpression("senderPublicKey", recipientWallet.publicKey),
            ]);

            return Contracts.Shared.OrExpression.make([recipientIdExpression, senderPublicKeyExpression]);
        } else {
            return recipientIdExpression;
        }
    }

    private async getAutoTypeGroupExpression(
        criteria: Contracts.Shared.TransactionCriteria,
    ): Promise<Contracts.Shared.WhereExpression> {
        if (this.handler.hasOrCriteria(criteria.type) && this.handler.hasOrCriteria(criteria.typeGroup) === false) {
            return new Contracts.Shared.EqualExpression("typeGroup", Enums.TransactionTypeGroup.Core);
        } else {
            return new Contracts.Shared.VoidExpression();
        }
    }
}
