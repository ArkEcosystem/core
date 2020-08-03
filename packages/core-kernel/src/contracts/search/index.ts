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
