import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";

import { Transaction } from "../models";

@Container.injectable()
export class TransactionFilter
    implements Contracts.Database.Filter<Contracts.Database.Transaction, Contracts.Database.TransactionCriteria> {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    private readonly filter = new Contracts.Database.AndFilter<Transaction, Contracts.Database.TransactionCriteria>({
        wallet: new Contracts.Database.OrFnFilter(this.getWalletExpression.bind(this)),
        senderId: new Contracts.Database.OrFnFilter(this.getSenderIdExpression.bind(this)),

        id: new Contracts.Database.OrEqualFilter("id"),
        version: new Contracts.Database.OrEqualFilter("version"),
        blockId: new Contracts.Database.OrEqualFilter("blockId"),
        sequence: new Contracts.Database.OrNumericFilter("sequence"),
        timestamp: new Contracts.Database.OrNumericFilter("timestamp"),
        nonce: new Contracts.Database.OrNumericFilter("nonce"),
        senderPublicKey: new Contracts.Database.OrEqualFilter("senderPublicKey"),
        recipientId: new Contracts.Database.OrFnFilter(this.getRecipientIdExpression.bind(this)),
        type: new Contracts.Database.OrEqualFilter("type"),
        typeGroup: new Contracts.Database.OrEqualFilter("typeGroup"),
        vendorField: new Contracts.Database.OrEqualFilter("vendorField"),
        amount: new Contracts.Database.OrNumericFilter("amount"),
        fee: new Contracts.Database.OrNumericFilter("fee"),
        asset: new Contracts.Database.OrContainsFilter("asset"),
    });

    public async getExpression(
        criteria: Contracts.Database.TransactionCriteria,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        return Contracts.Database.AndExpression.make([
            await this.filter.getExpression(criteria),
            await this.getTypeGroupAutoExpression(criteria),
        ]);
    }

    private async getTypeGroupAutoExpression(
        criteria: Contracts.Database.TransactionCriteria,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        if ("type" in criteria && Contracts.Database.hasOrCriteria(criteria.type)) {
            if ("typeGroup" in criteria === false || Contracts.Database.hasOrCriteria(criteria.typeGroup) === false) {
                return new Contracts.Database.EqualExpression("typeGroup", Enums.TransactionTypeGroup.Core);
            }
        }

        return new Contracts.Database.VoidExpression();
    }

    private async getWalletExpression(
        criteria: Contracts.Database.TransactionWalletCriteria,
    ): Promise<Contracts.Database.Expression<Transaction>> {
        const recipientIdExpression = new Contracts.Database.EqualExpression("recipientId", criteria.address);
        const assetExpression = new Contracts.Database.ContainsExpression("asset", {
            payment: [{ recipientId: criteria.address }],
        });

        if (criteria.publicKey) {
            const senderPublicKeyExpression = new Contracts.Database.EqualExpression(
                "senderPublicKey",
                criteria.publicKey,
            );

            return Contracts.Database.OrExpression.make([
                recipientIdExpression,
                assetExpression,
                senderPublicKeyExpression,
            ]);
        } else {
            return Contracts.Database.OrExpression.make([recipientIdExpression, assetExpression]);
        }
    }

    private async getSenderIdExpression(criteria: string): Promise<Contracts.Database.Expression<Transaction>> {
        const senderWallet = this.walletRepository.findByAddress(criteria);

        if (senderWallet && senderWallet.publicKey) {
            return new Contracts.Database.EqualExpression("senderPublicKey", senderWallet.publicKey);
        } else {
            return new Contracts.Database.FalseExpression();
        }
    }

    private async getRecipientIdExpression(criteria: string): Promise<Contracts.Database.Expression<Transaction>> {
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
}
