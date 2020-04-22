import { EntityRepository } from "typeorm";

import { Repositories, Models } from "@arkecosystem/core-database";
import { Repository } from "../contracts";

@EntityRepository(Models.Transaction)
export class TransactionRepository extends Repositories.AbstractEntityRepository<Models.Transaction> implements Repository {
    public async getReadStream(): Promise<NodeJS.ReadableStream> {
        return this.createQueryBuilder()
            .orderBy("timestamp" ,"ASC")
            .addOrderBy("sequence" ,"ASC")
            .stream();
    }
}
