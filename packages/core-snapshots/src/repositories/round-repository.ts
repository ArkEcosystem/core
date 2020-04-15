import { EntityRepository } from "typeorm";
import { Repositories, Models } from "@arkecosystem/core-database";

@EntityRepository(Models.Round)
export class RoundRepository extends Repositories.AbstractEntityRepository<Models.Round> {}
