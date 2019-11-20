import { ColumnType } from "typeorm";
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata";

export enum SearchOperator {
    Between = "between",
    Contains = "contains",
    Equal = "equal",
    GreaterThanEqual = "greaterThanEqual",
    In = "in",
    LessThanEqual = "lessThanEqual",
    Like = "like",

    // placeholder. For parameters that require custom(not a 1-to-1 field to column mapping) filtering logic on the data-layer repo
    Custom = "custom",
}

export interface SearchCriteria {
    field: string;
    operator: SearchOperator;
    value: string | number | object;
}

export interface SearchOrder {
    field: string;
    direction: "ASC" | "DESC";
}

export interface SearchPagination {
    offset: number;
    limit: number;
}

export interface SearchFilter {
    criteria: SearchCriteria[];
    orderBy?: SearchOrder[];
    offset?: number;
    limit?: number;
}

export class SearchQueryConverter {
    private static IGNORED_FIELD_NAMES: Set<string> = new Set([
        "orderBy",
        "limit",
        "offset",
        "page",
        "transform",
        "pagination",
    ]);

    public static toSearchFilter(query: any, pagination: SearchPagination, columns: ColumnMetadata[]): SearchFilter {
        const searchFilter: SearchFilter = {
            criteria: [],
            orderBy: [],
            limit: pagination.limit ?? 100,
            offset: pagination.offset ?? 0,
        };

        const fieldNames: string[] = Object.keys(query).filter(field => !this.IGNORED_FIELD_NAMES.has(field));
        for (const field of fieldNames) {
            const columnMetadata: ColumnMetadata | undefined = columns.find(column => column.propertyName === field);
            if (!columnMetadata) {
                searchFilter.criteria.push({
                    field,
                    operator: SearchOperator.Custom,
                    value: query[field],
                });
            } else {
                searchFilter.criteria.push({
                    field,
                    operator: this.mapColumnTypeToOperator(columnMetadata.type),
                    value: query[field],
                });
            }
        }

        return searchFilter;
    }

    // Search by query pretty much only requires `SearchOperator.Equal`
    private static mapColumnTypeToOperator(type: ColumnType): SearchOperator {
        // @ts-ignore
        // ColumnType can be a function String()
        if (type.name === "String") {
            return SearchOperator.Equal;
        }

        switch (type) {
            case "varchar":
            case "smallint":
            case "integer":
            case "bigint":
                return SearchOperator.Equal;
            default:
                throw new Error("Unexpected type: " + type);
        }
    }
}
