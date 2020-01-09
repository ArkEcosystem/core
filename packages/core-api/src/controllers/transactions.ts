import { Models, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Processor } from "@arkecosystem/core-transaction-pool";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class TransactionsController extends Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly transactionPool!: Contracts.TransactionPool.Connection;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor!: Contracts.P2P.NetworkMonitor;

    @Container.inject(Container.Identifiers.TransactionRepository)
    private readonly transactionRepository!: Repositories.TransactionRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions: Repositories.RepositorySearchResult<Models.Transaction> = await this.transactionRepository.searchByQuery(
            request.query,
            this.paginate(request),
        );

        return this.toPagination(transactions, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async store(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const processor: Contracts.TransactionPool.Processor = this.app.resolve(Processor);
        const result = await processor.validate((request.payload as any).transactions);

        if (result.broadcast.length > 0) {
            this.networkMonitor.broadcastTransactions(processor.getBroadcastTransactions());
        }

        return {
            data: {
                accept: result.accept,
                broadcast: result.broadcast,
                excess: result.excess,
                invalid: result.invalid,
            },
            errors: result.errors,
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
        const pagination = super.paginate(request);

        const data = (await this.transactionPool.getTransactions(pagination.offset, pagination.limit)).map(
            transaction => ({
                serialized: transaction.toString("hex"),
            }),
        );

        return super.toPagination(
            {
                count: await this.transactionPool.getPoolSize(),
                rows: data,
            },
            TransactionResource,
            (request.query.transform as unknown) as boolean,
        );
    }

    public async showUnconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transaction: Interfaces.ITransaction | undefined = await this.transactionPool.getTransaction(
            request.params.id,
        );

        if (!transaction) {
            return Boom.notFound("Transaction not found");
        }

        const data = { id: transaction.id, serialized: transaction.serialized.toString("hex") };

        return super.respondWithResource(data, TransactionResource, (request.query.transform as unknown) as boolean);
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
