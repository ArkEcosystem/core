import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Identities, Interfaces, Utils } from "@arkecosystem/crypto";

import { PoolTransactionCriteria } from "./pool-transaction";
import {
    SomeTransactionResource,
    SomeTransactionResourcesPage,
    TransformedTransactionResource,
} from "./transaction-resource";

@Container.injectable()
export class PoolTransactionService {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    public getTransaction(
        transform: boolean,
        transactionId: string,
        ...criterias: PoolTransactionCriteria[]
    ): SomeTransactionResource | undefined {
        const poolQuery = this.poolQuery.getFromHighestPriority().whereId(transactionId);

        if (!poolQuery.has()) {
            return undefined;
        }

        const poolTransaction = poolQuery.first();

        if (!AppUtils.Search.testCriterias(poolTransaction, ...criterias)) {
            return undefined;
        }

        if (transform) {
            return this.getTransformedTransactionResource(poolTransaction);
        } else {
            return this.getRawTransactionResource(poolTransaction);
        }
    }

    public getTransactions(
        transform: boolean,
        ...criterias: PoolTransactionCriteria[]
    ): Iterable<TransformedTransactionResource> | Iterable<Interfaces.ITransactionData> {
        if (transform) {
            return this.getTransformedTransactions(...criterias);
        } else {
            return this.getRawTransactions(...criterias);
        }
    }

    public getTransactionsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        transform: boolean,
        ...criterias: PoolTransactionCriteria[]
    ): SomeTransactionResourcesPage {
        if (transform) {
            return AppUtils.Search.getPage(pagination, ordering, this.getTransformedTransactions(...criterias));
        } else {
            return AppUtils.Search.getPage(pagination, ordering, this.getRawTransactions(...criterias));
        }
    }

    private *getTransformedTransactions(
        ...criterias: PoolTransactionCriteria[]
    ): Iterable<TransformedTransactionResource> {
        for (const poolTransaction of this.poolQuery.getAll()) {
            if (AppUtils.Search.testCriterias(poolTransaction.data, ...criterias)) {
                yield this.getTransformedTransactionResource(poolTransaction);
            }
        }
    }

    private *getRawTransactions(...criterias: PoolTransactionCriteria[]): Iterable<Interfaces.ITransactionData> {
        for (const poolTransaction of this.poolQuery.getAll()) {
            if (AppUtils.Search.testCriterias(poolTransaction.data, ...criterias)) {
                yield this.getRawTransactionResource(poolTransaction);
            }
        }
    }

    private getTransformedTransactionResource(
        poolTransaction: Interfaces.ITransaction,
    ): TransformedTransactionResource {
        const transactionData = poolTransaction.data;

        AppUtils.assert.defined<string>(transactionData.senderPublicKey);
        AppUtils.assert.defined<string>(transactionData.id);
        AppUtils.assert.defined<number>(transactionData.version);
        AppUtils.assert.defined<Utils.BigNumber>(transactionData.nonce);
        AppUtils.assert.defined<number>(transactionData.typeGroup);
        AppUtils.assert.defined<string>(transactionData.signature);
        AppUtils.assert.defined<object>(transactionData.asset);

        const sender = Identities.Address.fromPublicKey(transactionData.senderPublicKey);
        const recipient = transactionData.recipientId ?? sender;

        return {
            id: transactionData.id,
            blockId: undefined,
            version: transactionData.version,
            nonce: transactionData.nonce,
            type: transactionData.type,
            typeGroup: transactionData.typeGroup,
            amount: transactionData.amount,
            fee: transactionData.fee,
            sender,
            senderPublicKey: transactionData.senderPublicKey,
            recipient,
            signature: transactionData.signature,
            signSignature: transactionData.signSignature ?? transactionData.secondSignature,
            signatures: transactionData.signatures,
            vendorField: transactionData.vendorField,
            asset: transactionData.asset,
            confirmations: 0,
            timestamp: undefined,
        };
    }

    private getRawTransactionResource(poolTransaction: Interfaces.ITransaction): Interfaces.ITransactionData {
        return poolTransaction.data;
    }
}
