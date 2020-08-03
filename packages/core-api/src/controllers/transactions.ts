import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Handlers } from "@arkecosystem/core-transactions";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    PoolTransactionCriteria,
    PoolTransactionService,
    SomeTransactionResource,
    SomeTransactionResourcesPage,
    TransactionCriteria,
    TransactionService,
} from "../services";
import { Controller } from "./controller";

export type PoolAddTransactionsResult = {
    data: {
        accept: string[];
        broadcast: string[];
        excess: string[];
        invalid: string[];
    };
    errors?: {
        [id: string]: { type: string; message: string };
    };
};

@Container.injectable()
export class TransactionsController extends Controller {
    @Container.inject(Container.Identifiers.TransactionPoolProcessorFactory)
    private readonly createPoolProcessor!: Contracts.TransactionPool.ProcessorFactory;

    @Container.inject(Container.Identifiers.TransactionHandlerRegistry)
    @Container.tagged("state", "null")
    private readonly nullHandlerRegistry!: Handlers.Registry;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Identifiers.TransactionService)
    private readonly transactionService!: TransactionService;

    @Container.inject(Identifiers.PoolTransactionService)
    private readonly poolService!: PoolTransactionService;

    public async index(request: Hapi.Request): Promise<SomeTransactionResourcesPage> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as TransactionCriteria;

        return await this.transactionService.getTransactionsPage(pagination, ordering, transform, criteria);
    }

    public async search(request: Hapi.Request): Promise<SomeTransactionResourcesPage> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = request.payload;

        return await this.transactionService.getTransactionsPage(pagination, ordering, transform, criteria);
    }

    public async show(request: Hapi.Request): Promise<SomeTransactionResource | Boom> {
        const transaction = await this.transactionService.getTransaction(request.query.transform, request.params.id);

        if (!transaction) {
            return notFound("Transaction not found");
        }

        return transaction;
    }

    public async store(request: Hapi.Request): Promise<PoolAddTransactionsResult> {
        const poolProcessor = this.createPoolProcessor();
        await poolProcessor.process(request.payload);

        return {
            data: {
                accept: poolProcessor.accept,
                broadcast: poolProcessor.broadcast,
                excess: poolProcessor.excess,
                invalid: poolProcessor.invalid,
            },
            errors: poolProcessor.errors,
        };
    }

    public unconfirmed(request: Hapi.Request): SomeTransactionResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as PoolTransactionCriteria;

        return this.poolService.getTransactionsPage(pagination, ordering, transform, criteria);
    }

    public showUnconfirmed(request: Hapi.Request): SomeTransactionResource | Boom {
        const transform = request.query.transform as boolean;
        const transactionId = request.params.id as string;
        const transaction = this.poolService.getTransaction(transform, transactionId);

        if (!transaction) {
            return notFound("Transaction not found");
        }

        return transaction;
    }

    public async types(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const activatedTransactionHandlers = await this.nullHandlerRegistry.getActivatedHandlers();
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
        const activatedTransactionHandlers = await this.nullHandlerRegistry.getActivatedHandlers();
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
        const currentHeight: number = this.stateStore.getLastHeight();
        const activatedTransactionHandlers = await this.nullHandlerRegistry.getActivatedHandlers();
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
    }
}
