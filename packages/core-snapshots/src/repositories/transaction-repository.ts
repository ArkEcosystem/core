import { Models, Repositories } from "@arkecosystem/core-database";
import { EntityRepository } from "typeorm";

import { Repository } from "../contracts";

@EntityRepository(Models.Transaction)
export class TransactionRepository extends Repositories.AbstractRepository<Models.Transaction> implements Repository {
    public async getReadStream(start: number, end: number): Promise<NodeJS.ReadableStream> {
        return this.createQueryBuilder()
            .where("timestamp >= :start AND timestamp < :end", { start, end })
            .orderBy("timestamp", "ASC")
            .addOrderBy("sequence", "ASC")
            .stream();
    }

    public async countInRange(start: number, end: number): Promise<number> {
        return this.createQueryBuilder().where("timestamp >= :start AND timestamp < :end", { start, end }).getCount();
    }
}
