import { app } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { client } from "../services/client";
import { storage } from "../services/storage";

const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger = app.resolvePlugin<Logger.ILogger>("logger");
const database = app.resolvePlugin<PostgresConnection>("database");

export abstract class Index {
    public chunkSize: any;

    public abstract getType(): any;
    public abstract getIndex(): any;
    public abstract index(): any;
    public abstract listen(): any;

    /**
     * Create a new index instance.
     * @param  {Number} chunkSize
     * @return {void}
     */
    public setUp(chunkSize) {
        logger.info(`[Elasticsearch] Initialising ${this.getType()} index :scroll:`);
        this.chunkSize = chunkSize;

        logger.info(`[Elasticsearch] Initialising ${this.getType()} listener :radio:`);
        this.listen();

        logger.info(`[Elasticsearch] Indexing ${this.getIndex()} :bookmark:`);
        this.index();
    }

    protected createQuery() {
        return database.models[this.getType()].query();
    }

    protected count() {
        const modelQuery = this.createQuery();

        const query = modelQuery.select(modelQuery.count("count")).from(modelQuery);

        return database.query.one(query.toQuery());
    }

    /**
     * Register a new "CREATE" operation listener.
     * @param  {String} event
     * @return {void}
     */
    private registerCreateListener(event) {
        emitter.on(event, async doc => {
            try {
                const exists = await this.exists(doc);

                if (!exists) {
                    await this.create(doc);
                }
            } catch (error) {
                logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
            }
        });
    }

    /**
     * Register a new "DELETE" operation listener.
     * @param  {String} event
     * @return {void}
     */
    private registerDeleteListener(event) {
        emitter.on(event, async doc => {
            try {
                const exists = await this.exists(doc);

                if (exists) {
                    await this.delete(doc);
                }
            } catch (error) {
                logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
            }
        });
    }

    /**
     * Check if the specified document exists.
     * @param  {String} doc
     * @return {Promise}
     */
    private exists(doc) {
        return client.exists(this.getReadQuery(doc));
    }

    /**
     * Create a new document.
     * @param  {String} doc
     * @return {Promise}
     */
    private create(doc) {
        logger.info(`[Elasticsearch] Creating ${this.getType()} with ID ${doc.id}`);

        if (this.getType() === "block") {
            storage.update("history", { lastBlock: doc.height });
        } else {
            storage.update("history", { lastTransaction: doc.timestamp });
        }

        return client.create(this.getWriteQuery(doc));
    }

    /**
     * Delete the specified document.
     * @param  {String} doc
     * @return {Promise}
     */
    private delete(doc) {
        logger.info(`[Elasticsearch] Deleting ${this.getType()} with ID ${doc.id}`);

        return client.delete(this.getReadQuery(doc));
    }

    /**
     * Get a query for a "WRITE" operation.
     * @param  {String} doc
     * @return {Object}
     */
    private getWriteQuery(doc) {
        return {
            index: this.getIndex(),
            type: this.getType(),
            id: doc.id,
            body: doc,
        };
    }

    /**
     * Get a query for a "READ" operation.
     * @param  {String} doc
     * @return {Object}
     */
    private getReadQuery(doc) {
        return {
            index: this.getIndex(),
            type: this.getType(),
            id: doc.id,
        };
    }

    /**
     * Get a query for a "READ" operation.
     * @param  {String} doc
     * @return {Object}
     */
    private getUpsertQuery(doc) {
        return {
            action: {
                update: {
                    _index: this.getIndex(),
                    _type: this.getType(),
                    _id: doc.id,
                },
            },
            document: {
                doc,
                doc_as_upsert: true,
            },
        };
    }

    /**
     * Get a query for a "READ" operation.
     * @param  {Array} items
     * @return {Object}
     */
    private buildBulkUpsert(items) {
        const actions = [];

        items.forEach(item => {
            const query = this.getUpsertQuery(item);
            actions.push(query.action);
            actions.push(query.document);
        });

        return actions;
    }
}
