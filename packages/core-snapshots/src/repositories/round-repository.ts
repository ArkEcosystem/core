import { Models, Repositories } from "@arkecosystem/core-database";
import { Readable } from "stream";
import { EntityRepository } from "typeorm";

import { Repository } from "../contracts";

@EntityRepository(Models.Round)
export class RoundRepository extends Repositories.AbstractRepository<Models.Round> implements Repository {
    public async getReadStream(start: number, end: number): Promise<Readable> {
        return this.createQueryBuilder()
            .where("round >= :start AND round <= :end", { start, end })
            .orderBy("round", "ASC")
            .stream();
    }

    public async countInRange(start: number, end: number): Promise<number> {
        return this.createQueryBuilder().where("round >= :start AND round <= :end", { start, end }).getCount();
    }
}
