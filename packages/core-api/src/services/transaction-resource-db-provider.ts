import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { Identifiers } from "../identifiers";
import { DbTransactionProvider } from "./db-transaction-service";
import {
    SomeTransactionResource,
    SomeTransactionResourcesPage,
    TransactionCriteria,
    TransformedTransactionResource,
} from "./transaction-resource";

@Container.injectable()
export class TransactionResourceDbProvider {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-api")
    protected readonly apiConfiguration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Identifiers.DbTransactionService)
    private readonly dbTransactionProvider!: DbTransactionProvider;

    public async getTransaction(
        transform: boolean,
        transactionId: string,
        ...criterias: TransactionCriteria[]
    ): Promise<SomeTransactionResource | undefined> {
        const dbTransaction = await this.dbTransactionProvider.getTransaction({ id: transactionId }, ...criterias);

        if (!dbTransaction) {
            return undefined;
        }

        if (transform) {
            return this.getTransformedTransactionResource(dbTransaction);
        } else {
            return this.getRawTransactionResource(dbTransaction);
        }
    }

    public async getTransactionsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        transform: boolean,
        ...criterias: TransactionCriteria[]
    ): Promise<SomeTransactionResourcesPage> {
        if (ordering.length === 0) {
            ordering = ["blockHeight:desc", "sequence:desc"];
        }

        const dbPage = await this.dbTransactionProvider.getTransactionsPage(pagination, ordering, ...criterias);

        if (transform) {
            return { ...dbPage, results: dbPage.results.map((t) => this.getTransformedTransactionResource(t)) };
        } else {
            return { ...dbPage, results: dbPage.results.map((t) => this.getRawTransactionResource(t)) };
        }
    }

    private getTransformedTransactionResource(
        dbTransaction: Contracts.Database.TransactionModel,
    ): TransformedTransactionResource {
        const transactionData = Transactions.TransactionFactory.fromBytesUnsafe(
            dbTransaction.serialized,
            dbTransaction.id,
        ).data;

        const sender = this.walletRepository.findByPublicKey(dbTransaction.senderPublicKey).address;
        const recipient = dbTransaction.recipientId ?? sender;
        const confirmations = this.stateStore.getLastHeight() - dbTransaction.blockHeight + 1;

        return {
            id: dbTransaction.id,
            blockId: dbTransaction.blockId,
            version: dbTransaction.version,
            nonce: dbTransaction.nonce,
            type: dbTransaction.type,
            typeGroup: dbTransaction.typeGroup,
            amount: dbTransaction.amount,
            fee: dbTransaction.fee,
            sender,
            senderPublicKey: dbTransaction.senderPublicKey,
            recipient,
            signature: transactionData.signature!,
            signSignature: transactionData.signSignature ?? transactionData.secondSignature,
            signatures: transactionData.signatures,
            vendorField: dbTransaction.vendorField,
            asset: dbTransaction.asset,
            confirmations,
            timestamp: AppUtils.formatTimestamp(dbTransaction.timestamp),
        };
    }

    private getRawTransactionResource(dbTransaction: Contracts.Database.TransactionModel): Interfaces.ITransactionData {
        return Transactions.TransactionFactory.fromBytesUnsafe(dbTransaction.serialized, dbTransaction.id).data;
    }
}
