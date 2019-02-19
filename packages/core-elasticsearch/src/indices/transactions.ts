import { models } from "@arkecosystem/crypto";
import { client } from "../client";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

export class Transactions extends Index {
    public async index() {
        const { count } = await this.count();

        const queries = Math.ceil(count / this.chunkSize);

        for (let i = 0; i < queries; i++) {
            const modelQuery = this.createQuery();

            const query = modelQuery
                .select(modelQuery.block_id, modelQuery.serialized)
                .from(modelQuery)
                .where(modelQuery.timestamp.gte(storage.get("lastTransaction")))
                .order(modelQuery.timestamp.asc)
                .limit(this.chunkSize);

            let rows = await (this.database.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                rows = rows.map(row => {
                    const transaction: any = new models.Transaction(row.serialized.toString("hex"));
                    transaction.blockId = row.blockId;

                    return transaction;
                });

                const timestamps = rows.map(row => row.data.timestamp);
                this.logger.info(
                    `[ES] Indexing ${rows.length} transactions [${first(timestamps)} to ${last(timestamps)}]`,
                );

                try {
                    await client.bulk(this.buildBulkUpsert(rows));

                    storage.update({
                        lastTransaction: +last(timestamps),
                    });
                } catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen() {
        this.registerCreateListener("transaction.applied");

        this.registerDeleteListener("transaction.expired");
        this.registerDeleteListener("transaction.reverted");
    }
}
