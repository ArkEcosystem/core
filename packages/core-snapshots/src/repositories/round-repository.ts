// import { Interfaces } from "@arkecosystem/crypto";
import { EntityRepository } from "typeorm";

import { Repositories, Models } from "@arkecosystem/core-database";

@EntityRepository(Models.Round)
export class SnapshotRoundRepository extends Repositories.AbstractEntityRepository<Models.Round> {}
