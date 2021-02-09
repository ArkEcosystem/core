import { Repositories } from "@arkecosystem/core-database";
import { ObjectLiteral } from "typeorm";

export class AbstractRepository<TEntity extends ObjectLiteral> extends Repositories.AbstractRepository<TEntity> {
    public async countAll(): Promise<number> {
        const totalCountQueryBuilder = this.createQueryBuilder().select("COUNT(*) AS total_count");

        const totalCountRow = await totalCountQueryBuilder.getRawOne();
        return parseFloat(totalCountRow["total_count"]);
    }
}
