import { app, Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { client } from "../client";
import { storage } from "../storage";

export abstract class Index {
    protected readonly emitter: Contracts.Kernel.IEventDispatcher = app.resolve<Contracts.Kernel.IEventDispatcher>(
        "event-dispatcher",
    );
    protected readonly logger: Contracts.Kernel.ILogger = app.resolve<Contracts.Kernel.ILogger>("logger");
    protected readonly database: Contracts.Database.IDatabaseService = app.resolve<Contracts.Database.IDatabaseService>(
        "database",
    );

    public constructor(protected readonly chunkSize: number) {}

    public abstract index(): void;
    public abstract listen(): void;

    protected registerListener(method: "create" | "delete", event: string): void {
        this.emitter.listen(event, async (name, doc) => {
            try {
                const exists: boolean = await this.exists(doc);
                const shouldTakeAction: boolean = method === "create" ? !exists : exists;

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

        for (const item of rows) {
            const { action, document } = this.getUpsertQuery(item);
            actions.push(action);
            actions.push(document);
        }

        return client.bulk(actions);
    }

    protected async getIterations() {
        const countES: number = await this.countWithElastic();
        const countDB: number = await this.countWithDatabase();

        return Math.ceil((countDB - countES) / this.chunkSize);
    }

    protected async countWithDatabase(): Promise<number> {
        const modelQuery = this.createQuery();

        const query = modelQuery.select(modelQuery.count("count")).from(modelQuery);

        const { count } = await (this.database.connection as any).query.one(query.toQuery());

        return +count;
    }

    private async countWithElastic(): Promise<number> {
        try {
            const { body } = await client.count({
                index: this.getIndex(),
                type: this.getType(),
            });

            return +body.count;
        } catch (error) {
            return 0;
        }
    }

    private async exists(doc): Promise<boolean> {
        try {
            const { body } = await client.exists(this.getReadQuery(doc));

            return body;
        } catch (error) {
            return false;
        }
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
        return Managers.configManager.get("network.client.token").toLowerCase();
    }
}
