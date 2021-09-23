"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const lodash_chunk_1 = __importDefault(require("lodash.chunk"));
const path_1 = __importDefault(require("path"));
const pg_promise_1 = __importDefault(require("pg-promise"));
const migrations_1 = require("./migrations");
const queries_1 = require("./queries");
const repositories_1 = require("./repositories");
const query_executor_1 = require("./sql/query-executor");
const state_builder_1 = require("./state-builder");
const utils_1 = require("./utils");
class PostgresConnection {
    constructor(options, walletManager) {
        this.options = options;
        this.walletManager = walletManager;
        // @TODO: make this private
        this.models = {};
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.emitter = core_container_1.app.resolvePlugin("event-emitter");
    }
    async make() {
        if (this.db) {
            throw new Error("Database connection already initialised");
        }
        this.logger.debug("Connecting to database");
        this.cache = new Map();
        try {
            await this.connect();
            this.exposeRepositories();
            this.registerQueryExecutor();
            await this.runMigrations();
            await this.registerModels();
            this.logger.debug("Connected to database.");
            this.emitter.emit(core_interfaces_1.Database.DatabaseEvents.POST_CONNECT);
            return this;
        }
        catch (error) {
            core_container_1.app.forceExit("Unable to connect to the database!", error);
        }
        return undefined;
    }
    async connect() {
        this.emitter.emit(core_interfaces_1.Database.DatabaseEvents.PRE_CONNECT);
        const options = this.options;
        const pgp = pg_promise_1.default({
            ...options.initialization,
            ...{
                error: async (error, context) => {
                    // https://www.postgresql.org/docs/11/errcodes-appendix.html
                    // Class 53 — Insufficient Resources
                    // Class 57 — Operator Intervention
                    // Class 58 — System Error (errors external to PostgreSQL itself)
                    if (error.code && ["53", "57", "58"].includes(error.code.slice(0, 2))) {
                        core_container_1.app.forceExit("Unexpected database error. Shutting down to prevent further damage.", error);
                    }
                },
                receive(data) {
                    utils_1.camelizeColumns(pgp, data);
                },
                extend(object) {
                    for (const repository of Object.keys(repositories_1.repositories)) {
                        object[repository] = new repositories_1.repositories[repository](object, pgp, options);
                    }
                },
            },
        });
        this.pgp = pgp;
        this.db = this.pgp(this.options.connection);
    }
    async disconnect() {
        this.logger.debug("Disconnecting from database");
        this.emitter.emit(core_interfaces_1.Database.DatabaseEvents.PRE_DISCONNECT);
        try {
            this.cache.clear();
        }
        catch (error) {
            this.logger.warn("Issue in commiting blocks, database might be corrupted");
            this.logger.warn(error.message);
        }
        this.pgp.end();
        this.emitter.emit(core_interfaces_1.Database.DatabaseEvents.POST_DISCONNECT);
        this.logger.debug("Disconnected from database");
    }
    async buildWallets() {
        await new state_builder_1.StateBuilder(this, this.walletManager).run();
    }
    async deleteBlocks(blocks) {
        try {
            await this.db.tx(t => {
                const blockIds = blocks.map(block => block.id);
                // Delete all rounds after the current round if there are still
                // any left.
                const lastBlockHeight = blocks[blocks.length - 1].height;
                const { round } = core_utils_1.roundCalculator.calculateRound(lastBlockHeight);
                return t.batch([
                    this.transactionsRepository.deleteByBlockId(blockIds, t),
                    this.blocksRepository.delete(blockIds, t),
                    this.roundsRepository.delete(round + 1),
                ]);
            });
        }
        catch (error) {
            this.logger.error(error.message);
        }
    }
    async saveBlock(block) {
        await this.saveBlocks([block]);
    }
    async saveBlocks(blocks) {
        try {
            await this.db.tx(t => {
                const blockInserts = [];
                const transactionInserts = [];
                for (const block of blocks) {
                    blockInserts.push(block.data);
                    if (block.transactions.length > 0) {
                        let transactions = block.transactions.map(tx => ({
                            ...tx.data,
                            timestamp: tx.timestamp,
                            serialized: tx.serialized,
                        }));
                        // Order of transactions messed up in mainnet V1
                        const { wrongTransactionOrder } = crypto_1.Managers.configManager.get("exceptions");
                        if (wrongTransactionOrder && wrongTransactionOrder[block.data.id]) {
                            const fixedOrderIds = wrongTransactionOrder[block.data.id].reverse();
                            transactions = fixedOrderIds.map((id) => transactions.find(transaction => transaction.id === id));
                        }
                        transactionInserts.push(...transactions);
                    }
                }
                const queries = [this.blocksRepository.insert(blockInserts, t)];
                if (transactionInserts.length > 0) {
                    queries.push(this.transactionsRepository.insert(transactionInserts, t));
                }
                return t.batch(queries);
            });
        }
        catch (err) {
            this.logger.error(err.message);
            throw err;
        }
    }
    async resetAll() {
        return this.db.none(queries_1.queries.common.truncateAllTables);
    }
    /**
     * Run all migrations.
     * @return {void}
     */
    async runMigrations() {
        for (const migration of migrations_1.migrations) {
            const { name } = path_1.default.parse(migration.file);
            if (name === "20180304100000-create-migrations-table") {
                await this.query.none(migration);
            }
            else if (name === "20190917000000-add-asset-column-to-transactions-table") {
                await this.migrateTransactionsTableToAssetColumn(name, migration);
            }
            else {
                if (!(await this.migrationsRepository.findByName(name))) {
                    this.logger.debug(`Migrating ${name}`);
                    await this.query.none(migration);
                    await this.migrationsRepository.insert({ name });
                }
            }
        }
    }
    async migrateTransactionsTableToAssetColumn(name, migration) {
        const row = await this.migrationsRepository.findByName(name);
        if (row) {
            return;
        }
        this.logger.warn(`Migrating transactions table to assets. This may take a while.`);
        await this.query.none(migration);
        const all = await this.db.manyOrNone("SELECT id, serialized FROM transactions WHERE (type > 0 OR type_group != 1)");
        const { transactionIdFixTable } = crypto_1.Managers.configManager.get("exceptions");
        const chunks = lodash_chunk_1.default(all, 20000);
        for (const chunk of chunks) {
            await this.db.task(task => {
                const transactions = [];
                for (const tx of chunk) {
                    const transaction = crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(tx.serialized, tx.id);
                    if (transaction.data.asset) {
                        let transactionId = transaction.id;
                        // If the transaction is a broken v1 transaction use the broken id for the query.
                        if (transactionIdFixTable && transactionIdFixTable[transactionId]) {
                            transactionId = transactionIdFixTable[transactionId];
                        }
                        const query = this.pgp.helpers.update({
                            asset: transaction.data.asset,
                        }, ["asset"], "transactions") + ` WHERE id = '${transactionId}'`;
                        transactions.push(task.none(query));
                    }
                }
                return task.batch(transactions);
            });
        }
        await this.migrationsRepository.insert({
            name,
        });
    }
    async registerModels() {
        for (const [key, Value] of Object.entries(require("./models"))) {
            this.models[key.toLowerCase()] = new Value(this.pgp);
        }
    }
    registerQueryExecutor() {
        this.query = new query_executor_1.QueryExecutor(this);
    }
    exposeRepositories() {
        this.blocksRepository = this.db.blocks;
        this.transactionsRepository = this.db.transactions;
        this.roundsRepository = this.db.rounds;
        this.walletsRepository = this.db.wallets;
        this.migrationsRepository = this.db.migrations;
    }
}
exports.PostgresConnection = PostgresConnection;
//# sourceMappingURL=postgres-connection.js.map