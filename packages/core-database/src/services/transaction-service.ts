import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/crypto";

import { TransactionRepository } from "../repositories/transaction-repository";

@Container.injectable()
export class TransactionService implements Contracts.Database.TransactionService {
    @Container.inject(Container.Identifiers.TransactionRepository)
    private readonly transactionRepository!: TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionFilter)
    private readonly transactionFilter!: Contracts.Database.TransactionFilter;

    public async findOneByCriteria(
        criteria: Contracts.Database.OrTransactionCriteria,
    ): Promise<Interfaces.ITransactionData | undefined> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria);
        return this.transactionRepository.findOneByExpression(expression);
    }

    public async findOneById(id: string): Promise<Interfaces.ITransactionData | undefined> {
        const expression = await this.transactionFilter.getCriteriaExpression({ id });
        return this.transactionRepository.findOneByExpression(expression);
    }

    public async findManyByCriteria(
        criteria: Contracts.Database.OrTransactionCriteria,
    ): Promise<Interfaces.ITransactionData[]> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria);
        return this.transactionRepository.findManyByExpression(expression);
    }

    public async listByCriteria(
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria);
        return this.transactionRepository.listByExpression(expression, order, page);
    }

    public async listByBlockIdAndCriteria(
        blockId: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const blockIdExpression = await this.transactionFilter.getCriteriaExpression({ blockId });
        const criteriaExpression = await this.transactionFilter.getCriteriaExpression(criteria);
        const expression = Contracts.Database.AndExpression.make([blockIdExpression, criteriaExpression]);
        return this.transactionRepository.listByExpression(expression, order, page);
    }

    public async listHtlcClaimRefundByLockIds(
        lockIds: string[],
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression([
            {
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.HtlcClaim,
                asset: lockIds.map((lockId) => ({ claim: { lockTransactionId: lockId } })),
            },
            {
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.HtlcRefund,
                asset: lockIds.map((lockId) => ({ refund: { lockTransactionId: lockId } })),
            },
        ]);
        return this.transactionRepository.listByExpression(expression, order, page);
    }

    public async listVoteByCriteria(
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const voteExpression = await this.transactionFilter.getCriteriaExpression({
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
        });
        const criteriaExpression = await this.transactionFilter.getCriteriaExpression(criteria);
        const expression = Contracts.Database.AndExpression.make([voteExpression, criteriaExpression]);
        return this.transactionRepository.listByExpression(expression, order, page);
    }

    public async listByWalletAndCriteria(
        wallet: Contracts.State.Wallet,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const walletExpression = await this.transactionFilter.getWalletExpression(wallet);
        const criteriaExpression = await this.transactionFilter.getCriteriaExpression(criteria);
        const expression = Contracts.Database.AndExpression.make([walletExpression, criteriaExpression]);
        return this.transactionRepository.listByExpression(expression, order, page);
    }

    public async listBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const senderPublicKeyExpression = await this.transactionFilter.getCriteriaExpression({ senderPublicKey });
        const criteriaExpression = await this.transactionFilter.getCriteriaExpression(criteria);
        const expression = Contracts.Database.AndExpression.make([senderPublicKeyExpression, criteriaExpression]);
        return this.transactionRepository.listByExpression(expression, order, page);
    }

    public async listByRecipientIdAndCriteria(
        recipientId: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const recipientIdExpression = await this.transactionFilter.getCriteriaExpression({ recipientId });
        const criteriaExpression = await this.transactionFilter.getCriteriaExpression(criteria);
        const expression = Contracts.Database.AndExpression.make([recipientIdExpression, criteriaExpression]);
        return this.transactionRepository.listByExpression(expression, order, page);
    }

    public async listVoteBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const voteExpression = await this.transactionFilter.getCriteriaExpression({
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
        });
        const senderPublicKeyExpression = await this.transactionFilter.getCriteriaExpression({ senderPublicKey });
        const criteriaExpression = await this.transactionFilter.getCriteriaExpression(criteria);
        const expression = Contracts.Database.AndExpression.make([
            voteExpression,
            senderPublicKeyExpression,
            criteriaExpression,
        ]);
        return this.transactionRepository.listByExpression(expression, order, page);
    }

    public async listHtlcLockBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const lockExpression = await this.transactionFilter.getCriteriaExpression({
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.HtlcLock,
        });
        const senderPublicKeyExpression = await this.transactionFilter.getCriteriaExpression({ senderPublicKey });
        const criteriaExpression = await this.transactionFilter.getCriteriaExpression(criteria);
        const expression = Contracts.Database.AndExpression.make([
            lockExpression,
            senderPublicKeyExpression,
            criteriaExpression,
        ]);
        return this.transactionRepository.listByExpression(expression, order, page);
    }
}
