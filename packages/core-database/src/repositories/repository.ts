import { Utils } from "@arkecosystem/core-kernel";
import { FindManyOptions, ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";

import { SearchCriteria, SearchFilter, SearchOperator } from "./search";

export interface RepositorySearchResult<T> {
    rows: T[];
    count: number;
    countIsEstimate: boolean;
}

export abstract class AbstractEntityRepository<Entity extends ObjectLiteral> extends Repository<Entity> {
    public async findById(id: string): Promise<Entity> {
        return (await this.findByIds([id]))[0];
    }

    protected propertyToColumnName(property: string): string | undefined {
        // Property names coming from query parameters are always lowercase
        return this.metadata.columns.find(column => column.propertyName.toLowerCase() === property.toLowerCase())
            ?.databaseName;
    }

    protected criteriaToExpression(criteria: SearchCriteria): { expression: string; parameters: Record<string, any> } {
        const columnName: string | undefined = this.propertyToColumnName(criteria.field);

        Utils.assert.defined<string>(columnName);

        let parameters: Record<string, string | number | object> = {
            [criteria.field]: criteria.value,
        };

        let expression: string;

        switch (criteria.operator) {
            case SearchOperator.Equal:
                expression = `${columnName} = :${criteria.field}`;
                break;
            case SearchOperator.In:
                expression = `${columnName} IN (:...${criteria.field})`;
                break;
            case SearchOperator.GreaterThanEqual:
                expression = `${columnName} >= :${criteria.field}`;
                break;
            case SearchOperator.LessThanEqual:
                expression = `${columnName} <= :${criteria.field}`;
                break;
            case SearchOperator.Like:
                expression = `${columnName} %:${criteria.field}%`;
                break;
            case SearchOperator.Contains:
                expression = `${columnName} @> :${criteria.field}`;
                break;
            case SearchOperator.Between:
                expression = `${columnName} BETWEEN :from AND :to`;

                parameters = {
                    // @ts-ignore - Property 'to' does not exist on type 'string | number | object'.
                    to: criteria.value.to,
                    // @ts-ignore - Property 'to' does not exist on type 'string | number | object'.
                    from: criteria.value.from,
                };

                break;
            default:
                throw new Error(`Not supported: ${criteria.operator}`);
        }

        return {
            expression,
            parameters,
        };
    }

    protected rawToEntity(
        rawEntity: Record<string, any>,
        customPropertyHandler?: (entity: { [P in keyof Entity]?: Entity[P] }, key: string, value: any) => void,
    ): Entity {
        const entity: Entity = this.create();
        for (const [key, value] of Object.entries(rawEntity)) {
            // Replace auto-generated column name with property name, if any.
            const columnName: string = key.replace(`${this.metadata.givenTableName}_`, "");
            const columnMetadata: ColumnMetadata | undefined = this.metadata.columns.find(
                column => column.databaseName === columnName,
            );
            if (columnMetadata) {
                let propertyValue: any;

                if (value === undefined || value === null) {
                    propertyValue = undefined;
                } else if (columnMetadata.type === "bigint") {
                    propertyValue = Utils.BigNumber.make(value);
                } else if (columnMetadata.propertyName === "vendorField") {
                    propertyValue = propertyValue.toString("utf8");
                } else {
                    propertyValue = value;
                }

                entity[(columnMetadata.propertyName as unknown) as keyof Entity] = propertyValue;
            } else {
                // Just attach custom properties, which are probably wanted if `rawToEntity` is called.
                // TODO: add an additional type parameter (i.e. `this.rawToEntity<{ someField }>(result)`) to return
                // Entity & { someField } from the function.
                if (customPropertyHandler) {
                    customPropertyHandler(entity, key, value);
                } else {
                    entity[(key as unknown) as keyof Entity] = value;
                }
            }
        }

        return entity;
    }

    protected async performSearch(queryBuilder: SelectQueryBuilder<Entity>): Promise<RepositorySearchResult<Entity>> {
        const [rows, count]: [Entity[], number] = await queryBuilder.getManyAndCount();

        return {
            rows,
            count,
            countIsEstimate: false,
        };

        // console.log(
        //     await this.findAndCount({
        //         // @ts-ignore
        //         where: { senderPublicKey: findManyOptions.where.sender_public_key },
        //     }),
        // );

        // const count: number =
        //     rows.length && rows.length < findManyOptions.take!
        //         ? findManyOptions.take! + rows.length
        //         : await this.count(findManyOptions);

        // TODO:
        // if (this.options.estimateTotalCount) {
        //     // Get the last rows=... from something that looks like (1 column, few rows):
        //     //
        //     //                            QUERY PLAN
        //     // ------------------------------------------------------------------
        //     //  Limit  (cost=15.34..15.59 rows=100 width=622)
        //     //    ->  Sort  (cost=15.34..15.64 rows=120 width=622)
        //     //          Sort Key: "timestamp" DESC
        //     //          ->  Seq Scan on transactions  (cost=0.00..11.20 rows=120 width=622)

        //     let count: number = 0;
        //     const explainedQuery = await this.db.manyOrNone(`EXPLAIN ${selectQuery.toString()}`);
        //     for (const row of explainedQuery) {
        //         const line: any = Object.values(row)[0];
        //         const match = line.match(/rows=([0-9]+)/);
        //         if (match) {
        //             count = Number(match[1]);
        //         }
        //     }

        //     return { rows, count: Math.max(count, rows.length), countIsEstimate: true };
        // }
    }

    protected createFindManyOptions(filter: SearchFilter): FindManyOptions<Entity> {
        let order: { [P in keyof Entity]?: "ASC" | "DESC" } | undefined = undefined;
        if (filter.orderBy) {
            order = {};
            for (const orderBy of filter.orderBy) {
                const columnName: string | undefined = this.propertyToColumnName(orderBy.field);
                if (columnName) {
                    order[(columnName as unknown) as keyof Entity] = orderBy.direction;
                }
            }
        }

        return {
            order,
            take: filter.limit ?? undefined,
            skip: filter.offset ?? undefined,
        };
    }

    protected createQueryBuilderFromFilter(filter: SearchFilter): SelectQueryBuilder<Entity> {
        const queryBuilder: SelectQueryBuilder<Entity> = this.createQueryBuilder(this.metadata.name)
            .skip(filter.offset || undefined)
            .take(filter.limit ?? undefined);

        if (filter.orderBy) {
            for (const orderBy of filter.orderBy) {
                const columnName: string | undefined = this.propertyToColumnName(orderBy.field);
                if (columnName) {
                    queryBuilder.addOrderBy(columnName, orderBy.direction);
                }
            }
        }

        return queryBuilder;
    }
}
