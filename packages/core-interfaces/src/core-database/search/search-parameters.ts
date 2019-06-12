export enum SearchOperator {
    OP_EQ = "equals",
    OP_IN = "in",
    OP_GTE = "gte",
    OP_LTE = "lte",
    OP_LIKE = "like",
    OP_CONTAINS = "contains",
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
