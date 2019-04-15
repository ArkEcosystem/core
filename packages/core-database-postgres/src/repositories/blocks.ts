import { Database } from "@arkecosystem/core-interfaces";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Block } from "../models";
import { queries } from "../queries";
import { Repository } from "./repository";

export class BlocksRepository extends Repository implements Database.IBlocksRepository {
    public async findById(id: string): Promise<Interfaces.IBlockData> {
        return this.db.oneOrNone(queries.blocks.findById, { id });
    }

    public async findByIds(ids: string[]): Promise<Interfaces.IBlockData[]> {
        return this.findMany(
            this.query
                .select()
                .from(this.query)
                .where(this.query.id.in(ids))
                .group(this.query.id),
        );
    }

    public async findByHeight(height: number): Promise<Interfaces.IBlockData> {
        return this.db.oneOrNone(queries.blocks.findByHeight, { height });
    }

    public async findByHeights(heights: number[]): Promise<Interfaces.IBlockData[]> {
        return this.db.manyOrNone(queries.blocks.findByHeights, { heights });
    }

    public async count(): Promise<number> {
        return (await this.db.one(queries.blocks.count)).count;
    }

    public async common(ids: string[]): Promise<Interfaces.IBlockData[]> {
        return this.db.manyOrNone(queries.blocks.common, { ids });
    }

    public async headers(start: number, end: number): Promise<Interfaces.IBlockData[]> {
        return this.db.many(queries.blocks.headers, { start, end });
    }

    public async heightRange(start: number, end: number): Promise<Interfaces.IBlockData[]> {
        return this.db.manyOrNone(queries.blocks.heightRange, { start, end });
    }

    public async latest(): Promise<Interfaces.IBlockData> {
        return this.db.oneOrNone(queries.blocks.latest);
    }

    public async recent(): Promise<Interfaces.IBlockData[]> {
        return this.db.many(queries.blocks.recent);
    }

    public async statistics(): Promise<{
        numberOfTransactions: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
        count: number;
    }> {
        return this.db.one(queries.blocks.statistics);
    }

    public async top(count: number): Promise<Interfaces.IBlockData[]> {
        return this.db.many(queries.blocks.top, { top: count });
    }

    public async delete(id: string): Promise<void> {
        return this.db.none(queries.blocks.delete, { id });
    }

    /* TODO: Remove with v1 */
    public async findAll(params: Database.SearchParameters): Promise<{ rows: Interfaces.IBlockData[]; count: number }> {
        const selectQuery = this.query.select().from(this.query);
        // Blocks repo atm, doesn't search using any custom parameters
        const parameterList = params.parameters.filter(o => o.operator !== Database.SearchOperator.OP_CUSTOM);

        if (parameterList.length) {
            const first = parameterList.shift();

            /* Notice the difference between 'findAll' and 'search' is that the former assumes eq for all params passed in */
            if (first) {
                selectQuery.where(this.query[this.propToColumnName(first.field)].equals(first.value));

                for (const param of parameterList) {
                    selectQuery.and(this.query[this.propToColumnName(param.field)].equals(param.value));
                }
            }
        }

        return this.findManyWithCount(selectQuery, params.paginate, params.orderBy);
    }

    public async search(params: Database.SearchParameters): Promise<{ rows: Interfaces.IBlockData[]; count: number }> {
        // TODO: we're selecting all the columns right now. Add support for choosing specific columns, when it proves useful.
        const selectQuery = this.query.select().from(this.query);
        // Blocks repo atm, doesn't search using any custom parameters
        const parameterList = params.parameters.filter(o => o.operator !== Database.SearchOperator.OP_CUSTOM);

        if (parameterList.length) {
            let first;
            do {
                first = parameterList.shift();
                // ignore params whose operator is unknown
            } while (!first.operator && parameterList.length);

            if (first) {
                selectQuery.where(this.query[this.propToColumnName(first.field)][first.operator](first.value));
                for (const param of parameterList) {
                    selectQuery.and(this.query[this.propToColumnName(param.field)][param.operator](param.value));
                }
            }
        }

        return this.findManyWithCount(selectQuery, params.paginate, params.orderBy);
    }

    public getModel(): Block {
        return new Block(this.pgp);
    }
}
