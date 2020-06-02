export * from "./criteria";
export * from "./expressions";

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
