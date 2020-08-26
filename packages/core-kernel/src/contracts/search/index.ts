export * from "./criteria";
export * from "./expressions";

export type Ordering = {
    property: string;
    direction: "asc" | "desc";
}[];

export type Pagination = {
    offset: number;
    limit: number;
};

export type Options = {
    estimateTotalCount?: boolean;
};

export type ResultsPage<T> = {
    results: T[];
    totalCount: number;
    meta: { totalCountIsEstimate: boolean };
};
