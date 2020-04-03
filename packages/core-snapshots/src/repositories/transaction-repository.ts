// import { Interfaces } from "@arkecosystem/crypto";
import { EntityRepository } from "typeorm";

import { Repositories, Models } from "@arkecosystem/core-database";

@EntityRepository(Models.Transaction)
export class SnapshotTransactionRepository extends Repositories.AbstractEntityRepository<Models.Transaction> {}
