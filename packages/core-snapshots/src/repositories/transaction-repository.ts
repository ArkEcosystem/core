import { EntityRepository } from "typeorm";

import { Repositories, Models } from "@arkecosystem/core-database";

@EntityRepository(Models.Transaction)
export class TransactionRepository extends Repositories.AbstractEntityRepository<Models.Transaction> {}
