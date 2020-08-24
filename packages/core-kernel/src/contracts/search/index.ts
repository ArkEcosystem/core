export * from "./criteria";
export * from "./expressions";

export type Ordering = { path: string; direction: "asc" | "desc" }[];

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

// OLD (SHOULD BE REPLACED WITH ABOVE TYPES)

export type ListOrder = {
    property: string;
    direction: "asc" | "desc";
}[];

export type ListPage = {
    offset: number;
    limit: number;
};

export type ListResult<T> = {
    rows: T[];
    count: number;
    countIsEstimate: boolean;
};

export type ListOptions = {
    estimateTotalCount?: boolean;
};
