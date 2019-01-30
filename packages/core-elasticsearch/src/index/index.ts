import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app } from "@arkecosystem/core-kernel";
import { client } from "../services/client";
import { storage } from "../services/storage";

const emitter = app.resolve<Contracts.EventEmitter.EventEmitter>("event-emitter");
const database = app.resolve<PostgresConnection>("database");

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
        app.logger.info(`[Elasticsearch] Initialising ${this.getType()} index :scroll:`);
        this.chunkSize = chunkSize;

        app.logger.info(`[Elasticsearch] Initialising ${this.getType()} listener :radio:`);
        this.listen();

        app.logger.info(`[Elasticsearch] Indexing ${this.getIndex()} :bookmark:`);
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
                app.logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
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
                app.logger.error(`[Elasticsearch] ${error.message} :exclamation:`);
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
        app.logger.info(`[Elasticsearch] Creating ${this.getType()} with ID ${doc.id}`);

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
        app.logger.info(`[Elasticsearch] Deleting ${this.getType()} with ID ${doc.id}`);

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
        return database.models[this.getType()].query();
    }

    public __count() {
        const modelQuery = this.__createQuery();

        const query = modelQuery.select(modelQuery.count("count")).from(modelQuery);

        return database.query.one(query.toQuery());
    }
}
