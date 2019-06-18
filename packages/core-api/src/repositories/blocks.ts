import { IRepository } from "../interfaces";
import { Repository } from "./repository";
import { buildFilterQuery } from "./utils/build-filter-query";

// TODO: Deprecate this with v1 code
export class BlockRepository extends Repository implements IRepository {
    public async findAll(parameters: any = {}): Promise<any> {
        const selectQuery = this.query.select().from(this.query);

        const conditions = Object.entries(this._formatConditions(parameters));

        if (conditions.length) {
            const first = conditions.shift();

            selectQuery.where(this.query[first[0]].equals(first[1]));

            for (const condition of conditions) {
                selectQuery.and(this.query[condition[0]].equals(condition[1]));
            }
        }

        return this._findManyWithCount(selectQuery, {
            limit: parameters.limit,
            offset: parameters.offset,
            orderBy: this.__orderBy(parameters),
        });
    }

    public async findAllByGenerator(generatorPublicKey, paginator): Promise<any> {
        return this.findAll({ ...{ generatorPublicKey }, ...paginator });
    }

    public async findById(value): Promise<any> {
        const query = this.query
            .select()
            .from(this.query)
            .where(this.query.id.equals(value));

        // ensure that the value is not greater than 2147483647 (psql max int size)
        const height = +value;
        if (height <= 2147483647) {
            query.or(this.query.height.equals(height));
        }

        return this._find(query);
    }

    public async search(parameters): Promise<any> {
        const selectQuery = this.query.select().from(this.query);

        const conditions = buildFilterQuery(this._formatConditions(parameters), {
            exact: ["id", "version", "previous_block", "payload_hash", "generator_public_key", "block_signature"],
            between: [
                "timestamp",
                "height",
                "number_of_transactions",
                "total_amount",
                "total_fee",
                "reward",
                "payload_length",
            ],
        });

        if (conditions.length) {
            const first = conditions.shift();

            selectQuery.where(this.query[first.column][first.method](first.value));

            for (const condition of conditions) {
                selectQuery.and(this.query[condition.column][condition.method](condition.value));
            }
        }

        return this._findManyWithCount(selectQuery, {
            limit: parameters.limit,
            offset: parameters.offset,
            orderBy: this.__orderBy(parameters),
        });
    }

    public getModel(): any {
        return (this.databaseService.connection as any).models.block;
    }

    public __orderBy(parameters): string[] {
        if (!parameters.orderBy) {
            return ["height", "desc"];
        }

        const orderBy = parameters.orderBy.split(":").map(p => p.toLowerCase());
        if (orderBy.length !== 2 || ["desc", "asc"].includes(orderBy[1]) !== true) {
            return ["height", "desc"];
        }

        return orderBy;
    }
}
