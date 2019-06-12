export enum SearchOperator {
    OP_EQ = "equals",
    OP_IN = "in",
    OP_GTE = "gte",
    OP_LTE = "lte",
    OP_LIKE = "like",
    OP_CONTAINS = "contains",
    // placeholder. For parameters that require custom(not a 1-to-1 field to column mapping) filtering logic on the data-layer repo
    OP_CUSTOM = "custom_operator",
}

export interface ISearchParameter {
    field: string;
    value: any;
    operator: SearchOperator;
}

export interface ISearchOrderBy {
    field: string;
    direction: "asc" | "desc";
}

export interface ISearchPaginate {
    offset?: number;
    limit?: number;
}

export interface ISearchParameters {
    parameters: ISearchParameter[];
    orderBy?: ISearchOrderBy[];
    paginate?: ISearchPaginate;
}
