import { app, Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import path from "path";
import pgPromise, { IMain } from "pg-promise";

import { Migration } from "./interfaces";
import { migrations } from "./migrations";
import { Model } from "./models";
import { queries as sqlQueries } from "./queries";
import { repositories } from "./repositories";
import { MigrationsRepository } from "./repositories/migrations";
import { QueryExecutor } from "./sql/query-executor";
import { StateBuilder } from "./state-builder";
import { camelizeColumns } from "./utils";

export class PostgresConnection implements Contracts.Database.Connection {
    // @todo: make this private
    public models: { [key: string]: Model } = {};
    // @todo: make this private
    public query: QueryExecutor;
    // @todo: make this private
    public db: any;
    // @todo: make this private
    public blocksRepository: Contracts.Database.BlocksRepository;
    // @todo: make this private
    public roundsRepository: Contracts.Database.RoundsRepository;
    // @todo: make this private
    public transactionsRepository: Contracts.Database.TransactionsRepository;
    // @todo: make this private
    public walletsRepository: Contracts.Database.WalletsRepository;
    // @todo: make this private
    public pgp: IMain;
    private readonly logger: Contracts.Kernel.Log.Logger = app.log;
    private readonly emitter: Contracts.Kernel.Events.EventDispatcher = app.get<
        Contracts.Kernel.Events.EventDispatcher
    >(Container.Identifiers.EventDispatcherService);
    private migrationsRepository: MigrationsRepository;
    private cache: Map<any, any>;

    public constructor(
        readonly options: Record<string, any>,
        private readonly walletRepository: Contracts.State.WalletRepository,
        private readonly walletState,
    ) {}

    public async make(): Promise<Contracts.Database.Connection> {
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
            this.emitter.dispatch(Contracts.Database.DatabaseEvents.POST_CONNECT);

            return this;
        } catch (error) {
            app.terminate("Unable to connect to the database!", error);
        }

        return undefined;
    }

    public async connect(): Promise<void> {
        this.emitter.dispatch(Contracts.Database.DatabaseEvents.PRE_CONNECT);

        const options = this.options;

        const pgp: pgPromise.IMain = pgPromise({
            ...options.initialization,
            ...{
                error: async (error, context) => {
                    // https://www.postgresql.org/docs/11/errcodes-appendix.html
                    // Class 53 — Insufficient Resources
                    // Class 57 — Operator Intervention
                    // Class 58 — System Error (errors external to PostgreSQL itself)
                    if (error.code && ["53", "57", "58"].includes(error.code.slice(0, 2))) {
                        app.terminate("Unexpected database error. Shutting down to prevent further damage.", error);
                    }
                },
                receive(data) {
                    camelizeColumns(pgp, data);
                },
                extend(object) {
                    for (const repository of Object.keys(repositories)) {
                        object[repository] = new repositories[repository](object, pgp, options);
                    }
                },
            },
        });

        this.pgp = pgp;
        this.db = this.pgp(this.options.connection);
    }

    public async disconnect(): Promise<void> {
        this.logger.debug("Disconnecting from database");

        this.emitter.dispatch(Contracts.Database.DatabaseEvents.PRE_DISCONNECT);

        try {
            this.cache.clear();
        } catch (error) {
            this.logger.warning("Issue in commiting blocks, database might be corrupted");
            this.logger.warning(error.message);
        }

        this.pgp.end();

        this.emitter.dispatch(Contracts.Database.DatabaseEvents.POST_DISCONNECT);
        this.logger.debug("Disconnected from database");
    }

    public async buildWallets(): Promise<void> {
        await new StateBuilder(this, this.walletRepository, this.walletState).run();
    }

    public async deleteBlocks(blocks: Interfaces.IBlockData[]): Promise<void> {
        try {
            await this.db.tx(t => {
                const { nextRound } = Utils.roundCalculator.calculateRound(blocks[blocks.length - 1].height);
                const blockIds: string[] = blocks.map(block => block.id);

                return t.batch([
                    this.transactionsRepository.deleteByBlockId(blockIds, t),
                    this.blocksRepository.delete(blockIds, t),
                    this.roundsRepository.delete(nextRound, t),
                ]);
            });
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    public async saveBlock(block: Interfaces.IBlock): Promise<void> {
        await this.saveBlocks([block]);
    }

    public async saveBlocks(blocks: Interfaces.IBlock[]): Promise<void> {
        try {
            await this.db.tx(t => {
                const blockInserts: Interfaces.IBlockData[] = [];
                const transactionInserts: Interfaces.ITransactionData[] = [];

                for (const block of blocks) {
                    blockInserts.push(block.data);
                    if (block.transactions.length > 0) {
                        transactionInserts.push(
                            ...block.transactions.map(tx => ({
                                ...tx.data,
                                timestamp: tx.timestamp,
                                serialized: tx.serialized,
                            })),
                        );
                    }
                }

                const queries = [this.blocksRepository.insert(blockInserts, t)];

                if (transactionInserts.length > 0) {
                    queries.push(this.transactionsRepository.insert(transactionInserts, t));
                }

                return t.batch(queries);
            });
        } catch (err) {
            this.logger.error(err.message);
            throw err;
        }
    }

    public async resetAll(): Promise<void> {
        return this.db.none(sqlQueries.common.truncateAllTables);
    }

    /**
     * Run all migrations.
     * @return {void}
     */
    private async runMigrations(): Promise<void> {
        for (const migration of migrations) {
            const { name } = path.parse(migration.file);

            if (name === "20180304100000-create-migrations-table") {
                await this.query.none(migration);
            } else if (name === "20190313000000-add-asset-column-to-transactions-table") {
                await this.migrateTransactionsTableToAssetColumn(name, migration);
            } else {
                if (!(await this.migrationsRepository.findByName(name))) {
                    this.logger.debug(`Migrating ${name}`);

                    await this.query.none(migration);
                    await this.migrationsRepository.insert({ name });
                }
            }
        }
    }

    private async migrateTransactionsTableToAssetColumn(name: string, migration: pgPromise.QueryFile): Promise<void> {
        const row: Migration = await this.migrationsRepository.findByName(name);

        // Also run migration if the asset column is present, but missing values. E.g.
        // after restoring a snapshot without assets even though the database has already been migrated.
        let runMigration = !row;
        if (!runMigration) {
            const { missingAsset } = await this.db.one(
                `SELECT EXISTS (SELECT id FROM transactions WHERE type > 0 AND asset IS NULL) as "missingAsset"`,
            );
            if (missingAsset) {
                await this.db.none(`DELETE FROM migrations WHERE name = '${name}'`);
                runMigration = true;
            }
        }

        if (!runMigration) {
            return;
        }
        this.logger.warning(`Migrating transactions table to assets. This may take a while.`);

        await this.query.none(migration);

        const all = await this.db.manyOrNone("SELECT id, serialized FROM transactions WHERE type > 0");
        const { transactionIdFixTable } = Managers.configManager.get("exceptions");

        const chunks: Array<
            Array<{
                serialized: Buffer;
                id: string;
            }>
        > = Utils.chunk(all, 20000);

        for (const chunk of chunks) {
            await this.db.task(task => {
                const transactions = [];

                for (const tx of chunk) {
                    const transaction = Transactions.TransactionFactory.fromBytesUnsafe(tx.serialized, tx.id);
                    if (transaction.data.asset) {
                        let transactionId = transaction.id;

                        // If the transaction is a broken v1 transaction use the broken id for the query.
                        if (transactionIdFixTable && transactionIdFixTable[transactionId]) {
                            transactionId = transactionIdFixTable[transactionId];
                        }

                        const query =
                            this.pgp.helpers.update(
                                {
                                    asset: transaction.data.asset,
                                },
                                ["asset"],
                                "transactions",
                            ) + ` WHERE id = '${transactionId}'`;
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

    private async registerModels(): Promise<void> {
        for (const [key, Value] of Object.entries(require("./models"))) {
            this.models[key.toLowerCase()] = new (Value as any)(this.pgp);
        }
    }

    private registerQueryExecutor(): void {
        this.query = new QueryExecutor(this);
    }

    private exposeRepositories(): void {
        this.blocksRepository = this.db.blocks;
        this.transactionsRepository = this.db.transactions;
        this.roundsRepository = this.db.rounds;
        this.walletsRepository = this.db.wallets;
        this.migrationsRepository = this.db.migrations;
    }
}
