// import { Interfaces } from "@arkecosystem/crypto";
import { EntityRepository } from "typeorm";

import { Repositories, Models } from "@arkecosystem/core-database";

@EntityRepository(Models.Block)
export class SnapshotBlockRepository extends Repositories.AbstractEntityRepository<Models.Block> {}
