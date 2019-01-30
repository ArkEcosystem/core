import crypto from "crypto";
import fs from "fs";
import chunk from "lodash/chunk";
import path from "path";
import pgPromise from "pg-promise";
import pluralize from "pluralize";

import { ConnectionInterface } from "@arkecosystem/core-database";

import { app } from "@arkecosystem/core-kernel";

import { roundCalculator } from "@arkecosystem/core-utils";
import { Bignum, models } from "@arkecosystem/crypto";

import { SPV } from "./spv";

import { migrations } from "./migrations";
import { Model } from "./models";
import { repositories } from "./repositories";
import { QueryExecutor } from "./sql/query-executor";
import { camelizeColumns } from "./utils";

const { Block, Transaction } = models;

export class PostgresConnection extends ConnectionInterface {
    public models: { [key: string]: Model } = {};
    public query: QueryExecutor;
    public db: any;
    private cache: Map<any, any>;
    private pgp: any;
    private spvFinished: boolean;

    public constructor(readonly options: any) {
        super(options);
    }

    /**
     * Make the database connection instance.
     * @return {PostgresConnection}
     */
    public async make() {
        if (this.db) {
            throw new Error("Database connection already initialised");
        }

        this.logger.debug("Connecting to database");

        this.queuedQueries = null;
        this.cache = new Map();

        try {
            await this.connect();
            await this.__registerQueryExecutor();
            await this.__runMigrations();
            await this.__registerModels();
            await super._registerRepositories();
            await super._registerWalletManager();
            await this.loadBlocksFromCurrentRound();
            this.logger.debug("Connected to database.");

            return this;
        } catch (error) {
            // app.terminate("Unable to connect to the database!", error);
        }

        return null;
    }

    /**
     * Connect to the database.
     * @return {void}
     */
    public async connect() {
        const initialization = {
            receive(data, result, e) {
                camelizeColumns(pgp, data);
            },
            extend(object) {
                for (const repository of Object.keys(repositories)) {
                    object[repository] = new repositories[repository](object, pgp);
                }
            },
        };

        const pgp = pgPromise({ ...this.options.initialization, ...initialization });

        this.pgp = pgp;
        this.db = this.pgp(this.options.connection);
    }

    /**
     * Disconnects from the database and closes the cache.
     * @return {Promise} The successfulness of closing the Sequelize connection
     */
    public async disconnect() {
        try {
            await this.commitQueuedQueries();
            this.cache.clear();
        } catch (error) {
            this.logger.warn("Issue in commiting blocks, database might be corrupted");
            this.logger.warn(error.message);
        }

        this.logger.debug("Disconnecting from database");

        return this.pgp.end();
    }

    /**
     * Verify the blockchain stored on db is not corrupted making simple assertions:
     * - Last block is available
     * - Last block height equals the number of stored blocks
     * - Number of stored transactions equals the sum of block.numberOfTransactions in the database
     * - Sum of all tx fees equals the sum of block.totalFee
     * - Sum of all tx amount equals the sum of block.totalAmount
     * @return {Object} An object { valid, errors } with the result of the verification and the errors
     */
    public async verifyBlockchain() {
        const errors = [];

        const lastBlock = await this.getLastBlock();

        // Last block is available
        if (!lastBlock) {
            errors.push("Last block is not available");
        } else {
            const { count: numberOfBlocks } = await this.db.blocks.count();

            // Last block height equals the number of stored blocks
            if (lastBlock.data.height !== +numberOfBlocks) {
                errors.push(
                    `Last block height: ${lastBlock.data.height.toLocaleString()}, number of stored blocks: ${numberOfBlocks}`,
                );
            }
        }

        const blockStats = await this.db.blocks.statistics();
        const transactionStats = await this.db.transactions.statistics();

        // Number of stored transactions equals the sum of block.numberOfTransactions in the database
        if (blockStats.numberOfTransactions !== transactionStats.count) {
            errors.push(
                `Number of transactions: ${transactionStats.count}, number of transactions included in blocks: ${
                    blockStats.numberOfTransactions
                }`,
            );
        }

        // Sum of all tx fees equals the sum of block.totalFee
        if (blockStats.totalFee !== transactionStats.totalFee) {
            errors.push(
                `Total transaction fees: ${transactionStats.totalFee}, total of block.totalFee : ${
                    blockStats.totalFee
                }`,
            );
        }

        // Sum of all tx amount equals the sum of block.totalAmount
        if (blockStats.totalAmount !== transactionStats.totalAmount) {
            errors.push(
                `Total transaction amounts: ${transactionStats.totalAmount}, total of block.totalAmount : ${
                    blockStats.totalAmount
                }`,
            );
        }

        return {
            valid: !errors.length,
            errors,
        };
    }

    /**
     * Get the top 51 delegates.
     * @param  {Number} height
     * @param  {Array} delegates
     * @return {Array}
     */
    public async getActiveDelegates(height, delegates?) {
        const maxDelegates = this.config.getMilestone(height).activeDelegates;
        const round = Math.floor((height - 1) / maxDelegates) + 1;

        if (this.forgingDelegates && this.forgingDelegates.length && this.forgingDelegates[0].round === round) {
            return this.forgingDelegates;
        }

        // When called during applyRound we already know the delegates, so we don't have to query the database.
        if (!delegates || delegates.length === 0) {
            delegates = await this.db.rounds.findById(round);
        }

        const seedSource = round.toString();
        let currentSeed = crypto
            .createHash("sha256")
            .update(seedSource, "utf8")
            .digest();

        for (let i = 0, delCount = delegates.length; i < delCount; i++) {
            for (let x = 0; x < 4 && i < delCount; i++, x++) {
                const newIndex = currentSeed[x] % delCount;
                const b = delegates[newIndex];
                delegates[newIndex] = delegates[i];
                delegates[i] = b;
            }
            currentSeed = crypto
                .createHash("sha256")
                .update(currentSeed)
                .digest();
        }

        this.forgingDelegates = delegates.map(delegate => {
            delegate.round = +delegate.round;
            return delegate;
        });

        return this.forgingDelegates;
    }

    /**
     * Store the given round.
     * @param  {Array} delegates
     * @return {Array}
     */
    public async saveRound(delegates) {
        this.logger.info(`Saving round ${delegates[0].round.toLocaleString()}`);

        await this.db.rounds.create(delegates);

        this.emitter.emit("round.created", delegates);
    }

    /**
     * Delete the given round.
     * @param  {Number} round
     * @return {Promise}
     */
    public async deleteRound(round) {
        return this.db.rounds.delete(round);
    }

    /**
     * Load a list of wallets into memory.
     * @param  {Number} height
     * @return {Boolean} success
     */
    public async buildWallets(height) {
        this.walletManager.reset();

        const spvPath = `${process.env.CORE_PATH_CACHE}/spv.json`;

        if (fs.existsSync(spvPath)) {
            (fs as any).removeSync(spvPath);

            this.logger.info("Ark Core ended unexpectedly - resuming from where we left off :runner:");

            return true;
        }

        try {
            const spv = new SPV(this);
            const success = await spv.build(height);

            this.spvFinished = true;

            await this.__registerListeners();

            return success;
        } catch (error) {
            this.logger.error(error.stack);
        }

        return false;
    }

    /**
     * Load all wallets from database.
     * @return {Array}
     */
    public async loadWallets() {
        const wallets = await this.db.wallets.all();

        this.walletManager.index(wallets);

        return this.walletManager.all();
    }

    /**
     * Commit wallets from the memory.
     * @param  {Boolean} force
     * @return {void}
     */
    public async saveWallets(force) {
        const wallets = this.walletManager
            .allByPublicKey()
            .filter(wallet => wallet.publicKey && (force || wallet.dirty));

        // Remove dirty flags first to not save all dirty wallets in the exit handler
        // when called during a force insert right after SPV.
        this.walletManager.clear();

        if (force) {
            // all wallets to be updated, performance is better without upsert
            await this.db.wallets.truncate();

            try {
                const chunks = chunk(wallets, 5000).map(c => this.db.wallets.create(c));
                await this.db.tx(t => t.batch(chunks));
            } catch (error) {
                this.logger.error(error.stack);
            }
        } else {
            // NOTE: The list of delegates is calculated in-memory against the WalletManager,
            // so it is safe to perform the costly UPSERT non-blocking during round change only:
            // 'await saveWallets(false)' -> 'saveWallets(false)'
            try {
                const queries = wallets.map(wallet => this.db.wallets.updateOrCreate(wallet));
                await this.db.tx(t => t.batch(queries));
            } catch (error) {
                this.logger.error(error.stack);
            }
        }

        this.logger.info(`${wallets.length} modified ${pluralize("wallet", wallets.length)} committed to database`);

        this.emitter.emit("wallet.saved", wallets.length);

        // NOTE: commented out as more use cases to be taken care of
        // this.walletManager.purgeEmptyNonDelegates()
    }

    /**
     * Commit the given block.
     * NOTE: to be used when node is in sync and committing newly received blocks
     * @param  {Block} block
     * @return {void}
     */
    public async saveBlock(block) {
        try {
            const queries = [this.db.blocks.create(block.data)];

            if (block.transactions.length > 0) {
                queries.push(this.db.transactions.create(block.transactions));
            }

            await this.db.tx(t => t.batch(queries));
        } catch (err) {
            this.logger.error(err.message);
        }
    }

    /**
     * Delete the given block.
     * @param  {Block} block
     * @return {void}
     */
    public async deleteBlock(block) {
        try {
            const queries = [this.db.transactions.deleteByBlock(block.data.id), this.db.blocks.delete(block.data.id)];

            await this.db.tx(t => t.batch(queries));
        } catch (error) {
            this.logger.error(error.stack);

            throw error;
        }
    }

    /**
     * Stores the block in memory. Generated insert statements are stored in
     * `this.queuedQueries`, to be later saved to the database by calling commit.
     * NOTE: to use when rebuilding to decrease the number of database tx, and
     *       commit blocks (save only every 1000s for instance) by calling commit.
     * @param  {Block} block
     * @return {void}
     */
    public enqueueSaveBlock(block) {
        const queries = [this.db.blocks.create(block.data)];

        if (block.transactions.length > 0) {
            queries.push(this.db.transactions.create(block.transactions));
        }

        this.enqueueQueries(queries);
    }

    /**
     * Generated delete statements are stored in this.queuedQueries to be later
     * executed by calling this.commitQueuedQueries.
     * See also enqueueSaveBlock.
     * @param  {Block} block
     * @return {void}
     */
    public enqueueDeleteBlock(block) {
        const queries = [this.db.transactions.deleteByBlock(block.data.id), this.db.blocks.delete(block.data.id)];

        this.enqueueQueries(queries);
    }

    /**
     * Generated delete statements are stored in this.queuedQueries to be later
     * executed by calling this.commitQueuedQueries.
     * @param  {Number} round
     * @return {void}
     */
    public enqueueDeleteRound(height) {
        const { round, nextRound, maxDelegates } = roundCalculator.calculateRound(height);

        if (nextRound === round + 1 && height >= maxDelegates) {
            this.enqueueQueries([this.db.rounds.delete(nextRound)]);
        }
    }

    /**
     * Add queries to the queue to be executed when calling commit.
     * @param {Array} queries
     */
    public enqueueQueries(queries) {
        if (!this.queuedQueries) {
            this.queuedQueries = [];
        }

        (this.queuedQueries as any).push(...queries);
    }

    /**
     * Commit all queued queries.
     * NOTE: to be used in combination with enqueueSaveBlock and enqueueDeleteBlock.
     * @return {void}
     */
    public async commitQueuedQueries() {
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

    /**
     * Get a block.
     * @param  {Number} id
     * @return {Block}
     */
    public async getBlock(id) {
        // TODO: caching the last 1000 blocks, in combination with `saveBlock` could help to optimise
        const block = await this.db.blocks.findById(id);

        if (!block) {
            return null;
        }

        const transactions = await this.db.transactions.findByBlock(block.id);

        block.transactions = transactions.map(({ serialized }) => Transaction.deserialize(serialized.toString("hex")));

        return new Block(block);
    }

    /**
     * Get the last block.
     * @return {(Block|null)}
     */
    public async getLastBlock() {
        const block = await this.db.blocks.latest();

        if (!block) {
            return null;
        }

        const transactions = await this.db.transactions.latestByBlock(block.id);

        block.transactions = transactions.map(({ serialized }) => Transaction.deserialize(serialized.toString("hex")));

        return new Block(block);
    }

    /**
     * Get a transaction.
     * @param  {Number} id
     * @return {Promise}
     */
    public async getTransaction(id) {
        return this.db.transactions.findById(id);
    }

    /**
     * Get common blocks for the given IDs.
     * @param  {Array} ids
     * @return {Array}
     */
    public async getCommonBlocks(ids) {
        const state = app.resolve("state");
        let commonBlocks = state.getCommonBlocks(ids);
        if (commonBlocks.length < ids.length) {
            commonBlocks = await this.db.blocks.common(ids);
        }

        return commonBlocks;
    }

    /**
     * Get forged transactions for the given IDs.
     * @param  {Array} ids
     * @return {Array}
     */
    public async getForgedTransactionsIds(ids) {
        if (!ids.length) {
            return [];
        }

        const transactions = await this.db.transactions.forged(ids);

        return transactions.map(transaction => transaction.id);
    }

    /**
     * Get blocks for the given offset and limit.
     * @param  {Number} offset
     * @param  {Number} limit
     * @return {Array}
     */
    public async getBlocks(offset, limit) {
        let blocks = [];

        // The functions below return matches in the range [start, end], including both ends.
        const start = offset;
        const end = offset + limit - 1;

        if (app.has("state")) {
            blocks = app.resolve("state").getLastBlocksByHeight(start, end);
        }

        if (blocks.length !== limit) {
            blocks = await this.db.blocks.heightRange(start, end);

            await this.loadTransactionsForBlocks(blocks);
        }

        return blocks;
    }

    /**
     * Get top count blocks ordered by height DESC.
     * NOTE: Only used when trying to restore database integrity. The returned blocks may be unchained.
     * @param  {Number} count
     * @return {Array}
     */
    public async getTopBlocks(count) {
        const blocks = await this.db.blocks.top(count);

        await this.loadTransactionsForBlocks(blocks);

        return blocks;
    }

    /**
     * Load all transactions for the given blocks
     * @param  {Array} blocks
     * @return {void}
     */
    public async loadTransactionsForBlocks(blocks) {
        if (!blocks.length) {
            return;
        }

        const ids = blocks.map(block => block.id);

        let transactions = await this.db.transactions.latestByBlocks(ids);
        transactions = transactions.map(tx => {
            const data = Transaction.deserialize(tx.serialized.toString("hex"));
            data.blockId = tx.blockId;
            return data;
        });

        for (const block of blocks) {
            if (block.numberOfTransactions > 0) {
                block.transactions = transactions.filter(transaction => transaction.blockId === block.id);
            }
        }
    }

    /**
     * Get the 10 recent block ids.
     * @return {[]String}
     */
    public async getRecentBlockIds() {
        const state = app.resolve("state");
        let blocks = state
            .getLastBlockIds()
            .reverse()
            .slice(0, 10);

        if (blocks.length < 10) {
            blocks = await this.db.blocks.recent();
            blocks = blocks.map(block => block.id);
        }

        return blocks;
    }

    /**
     * Get the headers of blocks for the given offset and limit.
     * @param  {Number} offset
     * @param  {Number} limit
     * @return {Array}
     */
    public async getBlockHeaders(offset, limit) {
        const blocks = await this.db.blocks.headers(offset, offset + limit);

        return blocks.map(block => Block.serialize(block));
    }

    /**
     * Get the cache object
     * @return {Cache}
     */
    public getCache() {
        return this.cache;
    }

    /**
     * Run all migrations.
     * @return {void}
     */
    public async __runMigrations() {
        for (const migration of migrations) {
            const { name } = path.parse(migration.file);

            if (name === "20180304100000-create-migrations-table") {
                await this.query.none(migration);
            } else {
                const row = await this.db.migrations.findByName(name);

                if (row === null) {
                    this.logger.debug(`Migrating ${name}`);

                    await this.query.none(migration);

                    await this.db.migrations.create({ name });
                }
            }
        }
    }

    /**
     * Register all models.
     * @return {void}
     */
    public async __registerModels() {
        for (const [key, Value] of Object.entries(require("./models"))) {
            this.models[key.toLowerCase()] = new (Value as any)(this.pgp);
        }
    }

    /**
     * Register the query builder.
     * @return {void}
     */
    public __registerQueryExecutor() {
        this.query = new QueryExecutor(this);
    }

    /**
     * Register event listeners.
     * @return {void}
     */
    public __registerListeners() {
        super.__registerListeners();

        this.emitter.on("wallet.created.cold", async coldWallet => {
            try {
                const wallet = await this.db.wallets.findByAddress(coldWallet.address);

                if (wallet) {
                    Object.keys(wallet).forEach(key => {
                        if (["balance"].indexOf(key) !== -1) {
                            return;
                        }

                        coldWallet[key] = key !== "voteBalance" ? wallet[key] : new Bignum(wallet[key]);
                    });
                }
            } catch (err) {
                this.logger.error(err);
            }
        });

        this.emitter.once("shutdown", async () => {
            if (!this.spvFinished) {
                // Prevent dirty wallets to be saved when SPV didn't finish
                this.walletManager.clear();
            }
        });
    }
}
