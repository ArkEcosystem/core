import { EntityRepository } from "typeorm";
import { Repositories, Models } from "@arkecosystem/core-database";

import { Repository } from "../contracts";

@EntityRepository(Models.Round)
export class RoundRepository extends Repositories.AbstractEntityRepository<Models.Round> implements Repository {
    public async getReadStream(): Promise<NodeJS.ReadableStream> {
        return this.createQueryBuilder()
            .orderBy("round" ,"ASC")
            .stream();
    }
}
