import { Repositories } from "@arkecosystem/core-database";
import { ObjectLiteral } from "typeorm";

interface WhereExpression {
    where: string;
    parameters: ObjectLiteral;
}

export class AbstractRepository<TEntity extends ObjectLiteral> extends Repositories.AbstractRepository<TEntity> {
    public async fastCount(where?: WhereExpression): Promise<number> {
        const totalCountQueryBuilder = this.createQueryBuilder().select("COUNT(*) AS total_count");

        if (where) {
            totalCountQueryBuilder.where(where.where, where.parameters);
        }

        const totalCountRow = await totalCountQueryBuilder.getRawOne();
        return parseFloat(totalCountRow["total_count"]);
    }
}
