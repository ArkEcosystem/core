import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { client } from "../services/client";
import { storage } from "../services/storage";

const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger = app.resolvePlugin<Logger.ILogger>("logger");
const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

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

    /**
     * Register a new "CREATE" operation listener.
     * @param  {String} event
     * @return {void}
     */
    public _registerCreateListener(event) {
        emitter.on(event, async doc => {
            try {
                const exists = await this._exists(doc);

                if (!exists) {
                    await this._create(doc);
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
    public _registerDeleteListener(event) {
        emitter.on(event, async doc => {
            try {
                const exists = await this._exists(doc);

                if (exists) {
                    await this._delete(doc);
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
    public _exists(doc) {
        return client.exists(this._getReadQuery(doc));
    }

    /**
     * Create a new document.
     * @param  {String} doc
     * @return {Promise}
     */
    public _create(doc) {
        logger.info(`[Elasticsearch] Creating ${this.getType()} with ID ${doc.id}`);

        if (this.getType() === "block") {
            storage.update("history", { lastBlock: doc.height });
        } else {
            storage.update("history", { lastTransaction: doc.timestamp });
        }

        return client.create(this._getWriteQuery(doc));
    }

    /**
     * Delete the specified document.
     * @param  {String} doc
     * @return {Promise}
     */
    public _delete(doc) {
        logger.info(`[Elasticsearch] Deleting ${this.getType()} with ID ${doc.id}`);

        return client.delete(this._getReadQuery(doc));
    }

    /**
     * Get a query for a "WRITE" operation.
     * @param  {String} doc
     * @return {Object}
     */
    public _getWriteQuery(doc) {
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
    public _getReadQuery(doc) {
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
    public _getUpsertQuery(doc) {
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
    public _buildBulkUpsert(items) {
        const actions = [];

        items.forEach(item => {
            const query = this._getUpsertQuery(item);
            actions.push(query.action);
            actions.push(query.document);
        });

        return actions;
    }

    public __createQuery() {
        return (databaseService.connection as any).models[this.getType()].query();
    }

    public __count() {
        const modelQuery = this.__createQuery();

        const query = modelQuery.select(modelQuery.count("count")).from(modelQuery);

        return (databaseService.connection as any).query.one(query.toQuery());
    }
}
