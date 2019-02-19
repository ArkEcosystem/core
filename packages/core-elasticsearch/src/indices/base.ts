import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger } from "@arkecosystem/core-interfaces";
import { client } from "../client";
import { storage } from "../storage";

export abstract class Index {
    protected readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>(
        "event-emitter",
    );
    protected readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    protected readonly database: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    protected chunkSize: number;

    public constructor(chunkSize: number) {
        this.chunkSize = chunkSize;
    }

    public abstract index(): void;
    public abstract listen(): void;

    protected registerCreateListener(event) {
        this.emitter.on(event, async doc => {
            try {
                const exists = await this.exists(doc);

                if (!exists) {
                    await this.create(doc);
                }
            } catch (error) {
                this.logger.error(`[ES] ${error.message}`);
            }
        });
    }

    protected registerDeleteListener(event) {
        this.emitter.on(event, async doc => {
            try {
                const exists = await this.exists(doc);

                if (exists) {
                    await this.delete(doc);
                }
            } catch (error) {
                this.logger.error(`[ES] ${error.message}`);
            }
        });
    }

    protected createQuery() {
        return (this.database.connection as any).models[this.getType()].query();
    }

    protected buildBulkUpsert(items) {
        const actions = [];

        items.forEach(item => {
            const query = this.getUpsertQuery(item);
            actions.push(query.action);
            actions.push(query.document);
        });

        return actions;
    }

    protected async count() {
        const countES = await this.countWithElastic();
        const countDB = await this.countWithDatabase();

        return countDB - countES;
    }

    private async countWithDatabase(): Promise<number> {
        const modelQuery = this.createQuery();

        const query = modelQuery.select(modelQuery.count("count")).from(modelQuery);

        const { count } = await (this.database.connection as any).query.one(query.toQuery());

        return +count;
    }

    private async countWithElastic(): Promise<number> {
        try {
            const { count } = await client.count({
                index: this.getIndex(),
                type: this.getType(),
            });

            return +count;
        } catch (error) {
            return 0;
        }
    }

    private async exists(doc): Promise<boolean> {
        return client.exists(this.getReadQuery(doc));
    }

    private create(doc) {
        this.logger.info(`[ES] Creating ${this.getType()} with ID ${doc.id}`);

        storage.update(this.getType() === "block" ? { lastBlock: doc.height } : { lastTransaction: doc.timestamp });

        return client.create(this.getWriteQuery(doc));
    }

    private delete(doc) {
        this.logger.info(`[ES] Deleting ${this.getType()} with ID ${doc.id}`);

        return client.delete(this.getReadQuery(doc));
    }

    private getWriteQuery(doc) {
        return {
            index: this.getIndex(),
            type: this.getType(),
            id: doc.id,
            body: doc,
        };
    }

    private getReadQuery(doc) {
        return {
            index: this.getIndex(),
            type: this.getType(),
            id: doc.id,
        };
    }

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

    private getType(): string {
        return this.constructor.name.toLowerCase().slice(0, -1);
    }

    private getIndex(): string {
        return app
            .getConfig()
            .get("network.client.token")
            .toLowerCase();
    }
}
