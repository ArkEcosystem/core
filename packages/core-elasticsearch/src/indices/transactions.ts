import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Transactions as CryptoTransactions } from "@arkecosystem/crypto";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

export class Transactions extends Index {
    public async index(): Promise<void> {
        const iterations: number = await this.getIterations();

        for (let i = 0; i < iterations; i++) {
            const modelQuery = this.createQuery();

            const query = modelQuery
                .select(modelQuery.id, modelQuery.block_id, modelQuery.serialized)
                .from(modelQuery)
                .where(modelQuery.timestamp.gte(storage.get("lastTransaction")))
                .order(modelQuery.timestamp.asc)
                .limit(this.chunkSize);

            let rows = await (this.database.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                rows = rows.map(row => {
                    const { data } = CryptoTransactions.TransactionFactory.fromBytesUnsafe(row.serialized, row.id);
                    data.blockId = row.blockId;

                    return data;
                });

                const timestamps = rows.map(row => row.timestamp);
                this.logger.info(
                    `[ES] Indexing ${rows.length} transactions [${first(timestamps)} to ${last(timestamps)}]`,
                );

                try {
                    await this.bulkUpsert(rows);

                    storage.update({
                        lastTransaction: +last(timestamps),
                    });
                } catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen(): void {
        this.registerListener("create", ApplicationEvents.TransactionApplied);

        this.registerListener("delete", ApplicationEvents.TransactionExpired);
        this.registerListener("delete", ApplicationEvents.TransactionReverted);
    }
}
