import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import chunk from "lodash.chunk";
import path from "path";
import pgPromise, { IMain } from "pg-promise";
import { IntegrityVerifier } from "./integrity-verifier";
import { migrations } from "./migrations";
import { Model } from "./models";
import { repositories } from "./repositories";
import { MigrationsRepository } from "./repositories/migrations";
import { QueryExecutor } from "./sql/query-executor";
import { camelizeColumns } from "./utils";

export class PostgresConnection implements Database.IConnection {
    public models: { [key: string]: Model } = {};
    public query: QueryExecutor;
    public db: any;
    public blocksRepository: Database.IBlocksRepository;
    public roundsRepository: Database.IRoundsRepository;
    public transactionsRepository: Database.ITransactionsRepository;
    public walletsRepository: Database.IWalletsRepository;
    public pgp: IMain;
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
    private migrationsRepository: MigrationsRepository;
    private cache: Map<any, any>;
    private queuedQueries: any[];

    public constructor(
        readonly options: Record<string, any>,
        private readonly walletManager: Database.IWalletManager,
    ) {}

    public async make(): Promise<Database.IConnection> {
        if (this.db) {
            throw new Error("Database connection already initialised");
        }

        this.logger.debug("Connecting to database");

        this.queuedQueries = null;
        this.cache = new Map();

        try {
            await this.connect();
            this.exposeRepositories();
            await this.registerQueryExecutor();
            await this.runMigrations();
            await this.registerModels();
            this.logger.debug("Connected to database.");
            this.emitter.emit(Database.DatabaseEvents.POST_CONNECT);

            return this;
        } catch (error) {
            app.forceExit("Unable to connect to the database!", error);
        }

        return null;
    }

    public async connect(): Promise<void> {
        this.emitter.emit(Database.DatabaseEvents.PRE_CONNECT);

        const pgp: pgPromise.IMain = pgPromise({
            ...this.options.initialization,
            ...{
                receive(data) {
                    camelizeColumns(pgp, data);
                },
                extend(object) {
                    for (const repository of Object.keys(repositories)) {
                        object[repository] = new repositories[repository](object, pgp);
                    }
                },
            },
        });

        this.pgp = pgp;
        this.db = this.pgp(this.options.connection);
    }

    public async disconnect(): Promise<void> {
        this.logger.debug("Disconnecting from database");

        this.emitter.emit(Database.DatabaseEvents.PRE_DISCONNECT);

        try {
            await this.commitQueuedQueries();

            this.cache.clear();
        } catch (error) {
            this.logger.warn("Issue in commiting blocks, database might be corrupted");
            this.logger.warn(error.message);
        }

        await this.pgp.end();

        this.emitter.emit(Database.DatabaseEvents.POST_DISCONNECT);
        this.logger.debug("Disconnected from database");
    }

    public async buildWallets(): Promise<boolean> {
        try {
            return await new IntegrityVerifier(this.query, this.walletManager).run();
        } catch (error) {
            this.logger.error(error.stack);

            app.forceExit("Failed to build wallets. This indicates a problem with the database.");

            return false;
        }
    }

    public async commitQueuedQueries(): Promise<void> {
        if (!this.queuedQueries || this.queuedQueries.length === 0) {
            return;
        }

        this.logger.debug("Committing database transactions.");

        try {
            await this.db.tx(t => t.batch(this.queuedQueries));
        } catch (error) {
            this.logger.error(error);

            throw error;
        } finally {
            this.queuedQueries = null;
        }
    }

    public async deleteBlock(block: Interfaces.IBlock): Promise<void> {
        try {
            await this.db.tx(t =>
                t.batch([
                    this.transactionsRepository.deleteByBlockId(block.data.id),
                    this.blocksRepository.delete(block.data.id),
                ]),
            );
        } catch (error) {
            this.logger.error(error.stack);

            throw error;
        }
    }

    public enqueueDeleteBlock(block: Interfaces.IBlock): void {
        this.enqueueQueries([
            this.transactionsRepository.deleteByBlockId(block.data.id),
            this.blocksRepository.delete(block.data.id),
        ]);
    }

    public enqueueDeleteRound(height: number): void {
        const { round, nextRound, maxDelegates } = roundCalculator.calculateRound(height);

        if (nextRound === round + 1 && height >= maxDelegates) {
            this.enqueueQueries([this.roundsRepository.delete(nextRound)]);
        }
    }

    public async saveBlock(block: Interfaces.IBlock): Promise<void> {
        try {
            const queries = [this.blocksRepository.insert(block.data)];

            if (block.transactions.length > 0) {
                queries.push(
                    this.transactionsRepository.insert(
                        block.transactions.map(tx => ({
                            ...tx.data,
                            timestamp: tx.timestamp,
                            serialized: tx.serialized,
                        })),
                    ),
                );
            }

            await this.db.tx(t => t.batch(queries));
        } catch (err) {
            this.logger.error(err.message);
        }
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
                const row = await this.migrationsRepository.findByName(name);

                if (row === null) {
                    this.logger.debug(`Migrating ${name}`);

                    await this.query.none(migration);
                    await this.migrationsRepository.insert({ name });
                }
            }
        }
    }

    /**
     * Migrate transactions table to asset column.
     */
    private async migrateTransactionsTableToAssetColumn(name: string, migration: pgPromise.QueryFile): Promise<void> {
        const row = await this.migrationsRepository.findByName(name);

        // Also run migration if the asset column is present, but missing values. E.g.
        // after restoring a snapshot without assets even though the database has already been migrated.
        let runMigration = row === null;
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
        this.logger.warn(`Migrating transactions table. This may take a while.`);

        await this.query.none(migration);

        const all = await this.db.manyOrNone("SELECT id, serialized FROM transactions WHERE type > 0");
        const { transactionIdFixTable } = Managers.configManager.get("exceptions");

        for (const batch of chunk(all, 20000)) {
            await this.db.task(task => {
                const transactions = [];
                batch.forEach((tx: { serialized: Buffer; id: string }) => {
                    const transaction = Transactions.Transaction.fromBytesUnsafe(tx.serialized, tx.id);
                    if (transaction.data.asset) {
                        let transactionId = transaction.id;

                        // If the transaction is a broken v1 transaction use the broken id for the query.
                        if (transactionIdFixTable && transactionIdFixTable[transactionId]) {
                            transactionId = transactionIdFixTable[transactionId];
                        }

                        const query =
                            this.pgp.helpers.update({ asset: transaction.data.asset }, ["asset"], "transactions") +
                            ` WHERE id = '${transactionId}'`;
                        transactions.push(task.none(query));
                    }
                });

                return task.batch(transactions);
            });
        }

        await this.migrationsRepository.insert({ name });
    }

    private async registerModels(): Promise<void> {
        for (const [key, Value] of Object.entries(require("./models"))) {
            this.models[key.toLowerCase()] = new (Value as any)(this.pgp);
        }
    }

    private registerQueryExecutor(): void {
        this.query = new QueryExecutor(this);
    }

    private enqueueQueries(queries): void {
        if (!this.queuedQueries) {
            this.queuedQueries = [];
        }

        (this.queuedQueries as any).push(...queries);
    }

    private exposeRepositories(): void {
        this.blocksRepository = this.db.blocks;
        this.transactionsRepository = this.db.transactions;
        this.roundsRepository = this.db.rounds;
        this.walletsRepository = this.db.wallets;
        this.migrationsRepository = this.db.migrations;
    }
}
