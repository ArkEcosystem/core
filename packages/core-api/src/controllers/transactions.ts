import { Models, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransactionResource } from "../resources";
import { Controller } from "./controller";
import { Interfaces } from "@arkecosystem/crypto";

@Container.injectable()
export class TransactionsController extends Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.TransactionRepository)
    private readonly transactionRepository!: Repositories.TransactionRepository;

    @Container.inject(Container.Identifiers.TransactionPoolProcessorFactory)
    private readonly createProcessor!: Contracts.TransactionPool.ProcessorFactory;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions: Repositories.RepositorySearchResult<Models.Transaction> = await this.transactionRepository.searchByQuery(
            request.query,
            this.paginate(request),
        );

        return this.toPagination(transactions, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async store(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const processor: Contracts.TransactionPool.Processor = this.createProcessor();
        await processor.process(request.payload.transactions);
        return {
            data: {
                accept: processor.accept,
                broadcast: processor.broadcast,
                excess: processor.excess,
                invalid: processor.invalid,
            },
            errors: processor.errors,
        };
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction: Models.Transaction = await this.transactionRepository.findById(request.params.id);

        if (!transaction) {
            return Boom.notFound("Transaction not found");
        }

        return this.respondWithResource(
            transaction,
            TransactionResource,
            (request.query.transform as unknown) as boolean,
        );
    }

    public async unconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const pagination: Repositories.Search.SearchPagination = super.paginate(request);
        const all: Interfaces.ITransaction[] = Array.from(this.poolQuery.getAllFromHighestPriority());
        const transactions: Interfaces.ITransaction[] = all.slice(
            pagination.offset,
            pagination.offset + pagination.limit,
        );
        const rows = transactions.map(t => ({ serialized: t.serialized.toString("hex") }));

        return super.toPagination({ count: all.length, rows }, TransactionResource, !!request.query.transform);
    }

    public async showUnconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactionQuery: Contracts.TransactionPool.QueryIterable = this.poolQuery
            .getAllFromHighestPriority()
            .whereId(request.params.id);

        if (transactionQuery.has() === false) {
            return Boom.notFound("Transaction not found");
        }

        const transaction: Interfaces.ITransaction = transactionQuery.first();
        const data = { id: transaction.id, serialized: transaction.serialized.toString("hex") };

        return super.respondWithResource(data, TransactionResource, !!request.query.transform);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions: Repositories.RepositorySearchResult<Models.Transaction> = await this.transactionRepository.search(
            {
                ...request.query, // only for orderBy
                ...request.payload,
                ...this.paginate(request),
            },
        );

        return this.toPagination(transactions, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async types(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const activatedTransactionHandlers = await this.app
            .getTagged<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry, "state", "null")
            .getActivatedHandlers();
        const typeGroups: Record<string | number, Record<string, number>> = {};

        for (const handler of activatedTransactionHandlers) {
            const constructor = handler.getConstructor();

            const type: number | undefined = constructor.type;
            const typeGroup: number | undefined = constructor.typeGroup;
            const key: string | undefined = constructor.key;

            AppUtils.assert.defined<number>(type);
            AppUtils.assert.defined<number>(typeGroup);
            AppUtils.assert.defined<string>(key);

            if (typeGroups[typeGroup] === undefined) {
                typeGroups[typeGroup] = {};
            }

            typeGroups[typeGroup][key[0].toUpperCase() + key.slice(1)] = type;
        }

        return { data: typeGroups };
    }

    public async schemas(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const activatedTransactionHandlers = await this.app
            .getTagged<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry, "state", "null")
            .getActivatedHandlers();
        const schemasByType: Record<string, Record<string, any>> = {};

        for (const handler of activatedTransactionHandlers) {
            const constructor = handler.getConstructor();

            const type: number | undefined = constructor.type;
            const typeGroup: number | undefined = constructor.typeGroup;

            AppUtils.assert.defined<number>(type);
            AppUtils.assert.defined<number>(typeGroup);

            if (schemasByType[typeGroup] === undefined) {
                schemasByType[typeGroup] = {};
            }

            schemasByType[typeGroup][type] = constructor.getSchema().properties;
        }

        return { data: schemasByType };
    }

    public async fees(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const currentHeight: number = this.app
                .get<Contracts.State.StateStore>(Container.Identifiers.StateStore)
                .getLastHeight();

            const activatedTransactionHandlers = await this.app
                .getTagged<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry, "state", "null")
                .getActivatedHandlers();

            const typeGroups: Record<string | number, Record<string, string>> = {};

            for (const handler of activatedTransactionHandlers) {
                const constructor = handler.getConstructor();

                const { typeGroup, key } = constructor;
                AppUtils.assert.defined<number>(typeGroup);
                AppUtils.assert.defined<string>(key);

                if (typeGroups[typeGroup] === undefined) {
                    typeGroups[typeGroup] = {};
                }

                typeGroups[typeGroup][key] = constructor.staticFee({ height: currentHeight }).toFixed();
            }

            return { data: typeGroups };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
