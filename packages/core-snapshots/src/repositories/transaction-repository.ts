import { Models } from "@arkecosystem/core-database";
import { Readable } from "stream";
import { EntityRepository } from "typeorm";

import { AbstractRepository } from "./abstract-repository";

@EntityRepository(Models.Transaction)
export class TransactionRepository extends AbstractRepository<Models.Transaction> {
    public async getReadStream(start: number, end: number): Promise<Readable> {
        return this.createQueryBuilder()
            .where("timestamp >= :start AND timestamp <= :end", { start, end })
            .orderBy("timestamp", "ASC")
            .addOrderBy("sequence", "ASC")
            .stream();
    }

    public async countInRange(start: number, end: number): Promise<number> {
        return this.fastCount({ where: "timestamp >= :start AND timestamp <= :end", parameters: { start, end } });
    }
}
