"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const client_1 = require("../client");
const storage_1 = require("../storage");
class Index {
    constructor(chunkSize) {
        this.chunkSize = chunkSize;
        this.emitter = core_container_1.app.resolvePlugin("event-emitter");
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.database = core_container_1.app.resolvePlugin("database");
    }
    registerListener(method, event) {
        this.emitter.on(event, async (doc) => {
            try {
                const exists = await this.exists(doc);
                const shouldTakeAction = method === "create" ? !exists : exists;
                if (shouldTakeAction) {
                    if (method === "create") {
                        this.logger.info(`[ES] Creating ${this.getType()} with ID ${doc.id}`);
                        storage_1.storage.update(this.getType() === "block" ? { lastBlock: doc.height } : { lastTransaction: doc.timestamp });
                        await client_1.client.create({
                            index: this.getIndex(),
                            type: this.getType(),
                            id: doc.id,
                            body: doc,
                        });
                    }
                    else {
                        this.logger.info(`[ES] Deleting ${this.getType()} with ID ${doc.id}`);
                        await client_1.client.delete(this.getReadQuery(doc));
                    }
                }
            }
            catch (error) {
                this.logger.error(`[ES] ${error.message}`);
            }
        });
    }
    createQuery() {
        return this.database.connection.models[this.getType()].query();
    }
    bulkUpsert(rows) {
        const actions = [];
        for (const item of rows) {
            const { action, document } = this.getUpsertQuery(item);
            actions.push(action);
            actions.push(document);
        }
        return client_1.client.bulk(actions);
    }
    async getIterations() {
        const countES = await this.countWithElastic();
        const countDB = await this.countWithDatabase();
        return Math.ceil((countDB - countES) / this.chunkSize);
    }
    async countWithDatabase() {
        const modelQuery = this.createQuery();
        const query = modelQuery.select(modelQuery.count("count")).from(modelQuery);
        const { count } = await this.database.connection.query.one(query.toQuery());
        return +count;
    }
    async countWithElastic() {
        try {
            const { body } = await client_1.client.count({
                index: this.getIndex(),
                type: this.getType(),
            });
            return +body.count;
        }
        catch (error) {
            return 0;
        }
    }
    async exists(doc) {
        try {
            const { body } = await client_1.client.exists(this.getReadQuery(doc));
            return body;
        }
        catch (error) {
            return false;
        }
    }
    getReadQuery(doc) {
        return {
            index: this.getIndex(),
            type: this.getType(),
            id: doc.id,
        };
    }
    getUpsertQuery(doc) {
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
    getType() {
        return this.constructor.name.toLowerCase().slice(0, -1);
    }
    getIndex() {
        return core_container_1.app
            .getConfig()
            .get("network.client.token")
            .toLowerCase();
    }
}
exports.Index = Index;
//# sourceMappingURL=base.js.map