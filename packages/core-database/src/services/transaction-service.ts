import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Transactions } from "@arkecosystem/crypto";

import { Transaction } from "../models/transaction";
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
        const model = await this.transactionRepository.findOneByExpression(expression);
        return model ? this.convertModel(model) : undefined;
    }

    public async findOneById(id: string): Promise<Interfaces.ITransactionData | undefined> {
        const expression = await this.transactionFilter.getCriteriaExpression({ id });
        const model = await this.transactionRepository.findOneByExpression(expression);
        return model ? this.convertModel(model) : undefined;
    }

    public async findManyByCriteria(
        criteria: Contracts.Database.OrTransactionCriteria,
    ): Promise<Interfaces.ITransactionData[]> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria);
        const models = await this.transactionRepository.findManyByExpression(expression);
        return this.convertModels(models);
    }

    public async listByCriteria(
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria);
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    public async listByBlockIdAndCriteria(
        blockId: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria, { blockId });
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
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
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    public async listVoteByCriteria(
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria, {
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
        });
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    public async listByWalletAndCriteria(
        wallet: Contracts.State.Wallet,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria, {
            recipientId: wallet.address,
            asset: { payment: [{ recipientId: wallet.address }] },
            senderPublicKey: wallet.publicKey,
        });
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    public async listBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria, { senderPublicKey });
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    public async listByRecipientIdAndCriteria(
        recipientId: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria, { recipientId });
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    public async listVoteBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria, {
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.Vote,
            senderPublicKey,
        });
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    public async listHtlcLockBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: Contracts.Database.OrTransactionCriteria,
        order: Contracts.Database.ListOrder,
        page: Contracts.Database.ListPage,
    ): Promise<Contracts.Database.ListResult<Interfaces.ITransactionData>> {
        const expression = await this.transactionFilter.getCriteriaExpression(criteria, {
            typeGroup: Enums.TransactionTypeGroup.Core,
            type: Enums.TransactionType.HtlcLock,
            senderPublicKey,
        });
        const listResult = await this.transactionRepository.listByExpression(expression, order, page);
        return this.convertListResult(listResult);
    }

    private convertModel(model: Transaction): Interfaces.ITransactionData {
        const data = Transactions.TransactionFactory.fromBytesUnsafe(model.serialized, model.id).data;
        data.nonce = model.nonce; // set_row_nonce trigger
        data.blockId = model.blockId; // block constructor
        return data;
    }

    private convertModels(models: Transaction[]): Interfaces.ITransactionData[] {
        return models.map((m) => this.convertModel(m));
    }

    private convertListResult(
        listResult: Contracts.Database.ListResult<Transaction>,
    ): Contracts.Database.ListResult<Interfaces.ITransactionData> {
        return {
            rows: this.convertModels(listResult.rows),
            count: listResult.count,
            countIsEstimate: listResult.countIsEstimate,
        };
    }
}
