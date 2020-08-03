export * from "./criteria";
export * from "./expressions";

export type ParsedOrdering = {
    path: string[];
    direction: "asc" | "desc";
}[];

export type Ordering = string | Ordering[];

export type Pagination = {
    offset: number;
    limit: number;
};

export type Options = {
    estimateTotalCount?: boolean;
};

export type Page<T> = {
    results: T[];
    totalCount: number;
    meta: { totalCountIsEstimate: boolean };
};

// LEGACY

export type ListOrder = {
    property: string;
    direction: "asc" | "desc";
}[];

export type ListPage = {
    offset: number;
    limit: number;
};

export type ListOptions = {
    estimateTotalCount?: boolean;
};

export type ListResult<T> = {
    rows: T[];
    count: number;
    countIsEstimate: boolean;
};

export type ListResultPage<T> = {
    results: T[];
    totalCount: number;
    meta: { totalCountIsEstimate: boolean };
};
