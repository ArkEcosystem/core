"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_transactions_1 = require("@arkecosystem/core-transactions");
const boom_1 = __importDefault(require("@hapi/boom"));
const controller_1 = require("../shared/controller");
class TransactionsController extends controller_1.Controller {
    constructor() {
        super(...arguments);
        this.transactionPool = core_container_1.app.resolvePlugin("transaction-pool");
    }
    async index(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.transactions.index(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async store(request, h) {
        try {
            const processor = this.transactionPool.makeProcessor();
            const result = await processor.validate(request.payload.transactions);
            if (result.broadcast.length > 0) {
                core_container_1.app.resolvePlugin("p2p")
                    .getMonitor()
                    .broadcastTransactions(processor.getBroadcastTransactions());
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
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async show(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.transactions.show(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async unconfirmed(request, h) {
        try {
            const pagination = super.paginate(request);
            const data = (await this.transactionPool.getTransactions(pagination.offset, pagination.limit)).map(transaction => ({
                serialized: transaction.toString("hex"),
            }));
            return super.toPagination({
                count: await this.transactionPool.getPoolSize(),
                rows: data,
            }, "transaction", request.query.transform);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async showUnconfirmed(request, h) {
        try {
            const transaction = await this.transactionPool.getTransaction(request.params.id);
            if (!transaction) {
                return boom_1.default.notFound("Transaction not found");
            }
            const data = { id: transaction.id, serialized: transaction.serialized.toString("hex") };
            return super.respondWithResource(data, "transaction", request.query.transform);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async search(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.transactions.search(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async types(request, h) {
        try {
            const activatedTransactionHandlers = await core_transactions_1.Handlers.Registry.getActivatedTransactionHandlers();
            const typeGroups = {};
            for (const handler of activatedTransactionHandlers) {
                const constructor = handler.getConstructor();
                const { type, typeGroup, key } = constructor;
                if (typeGroups[typeGroup] === undefined) {
                    typeGroups[typeGroup] = {};
                }
                typeGroups[typeGroup][key[0].toUpperCase() + key.slice(1)] = type;
            }
            return { data: typeGroups };
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async schemas(request, h) {
        try {
            const activatedTransactionHandlers = await core_transactions_1.Handlers.Registry.getActivatedTransactionHandlers();
            const schemasByType = {};
            for (const handler of activatedTransactionHandlers) {
                const constructor = handler.getConstructor();
                const { type, typeGroup } = constructor;
                if (schemasByType[typeGroup] === undefined) {
                    schemasByType[typeGroup] = {};
                }
                schemasByType[typeGroup][type] = constructor.getSchema().properties;
            }
            return { data: schemasByType };
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async fees(request, h) {
        try {
            const currentHeight = core_container_1.app
                .resolvePlugin("state")
                .getStore()
                .getLastHeight();
            const activatedTransactionHandlers = await core_transactions_1.Handlers.Registry.getActivatedTransactionHandlers();
            const typeGroups = {};
            for (const handler of activatedTransactionHandlers) {
                const constructor = handler.getConstructor();
                const { typeGroup, key } = constructor;
                if (typeGroups[typeGroup] === undefined) {
                    typeGroups[typeGroup] = {};
                }
                typeGroups[typeGroup][key] = constructor.staticFee({ height: currentHeight }).toFixed();
            }
            return { data: typeGroups };
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
}
exports.TransactionsController = TransactionsController;
//# sourceMappingURL=controller.js.map