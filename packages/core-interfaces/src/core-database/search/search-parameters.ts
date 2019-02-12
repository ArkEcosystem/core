export enum SearchOperator {
    OP_EQ = 'equals',
    OP_IN = 'in',
    OP_GTE = 'gte',
    OP_LTE = 'lte',
    OP_LIKE = 'like'
}


export interface SearchParameter {
    field : string;
    value: any;
    operator: SearchOperator;
}

export interface SearchOrderBy {
    field: string;
    direction: 'asc' | 'desc';
}

export interface SearchPaginate {
    offset?: number;
    limit?: number;
}

export interface SearchParameters {
    parameters: SearchParameter[];
    orderBy?: SearchOrderBy[];
    paginate?: SearchPaginate;
}
