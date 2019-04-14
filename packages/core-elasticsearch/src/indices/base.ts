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

    protected registerListener(method: "create" | "delete", event: string): void {
        this.emitter.on(event, async doc => {
            try {
                const exists = await this.exists(doc);
                const shouldTakeAction = method === "create" ? !exists : exists;

                if (shouldTakeAction) {
                    if (method === "create") {
                        this.logger.info(`[ES] Creating ${this.getType()} with ID ${doc.id}`);

                        storage.update(
                            this.getType() === "block" ? { lastBlock: doc.height } : { lastTransaction: doc.timestamp },
                        );

                        await client.create({
                            index: this.getIndex(),
                            type: this.getType(),
                            id: doc.id,
                            body: doc,
                        });
                    } else {
                        this.logger.info(`[ES] Deleting ${this.getType()} with ID ${doc.id}`);

                        await client.delete(this.getReadQuery(doc));
                    }
                }
            } catch (error) {
                this.logger.error(`[ES] ${error.message}`);
            }
        });
    }

    protected createQuery() {
        return (this.database.connection as any).models[this.getType()].query();
    }

    protected bulkUpsert(rows) {
        const actions = [];

        rows.forEach(item => {
            const query = this.getUpsertQuery(item);
            actions.push(query.action);
            actions.push(query.document);
        });

        return client.bulk(actions);
    }

    protected async getIterations() {
        const countES = await this.countWithElastic();
        const countDB = await this.countWithDatabase();

        return Math.ceil((countDB - countES) / this.chunkSize);
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
