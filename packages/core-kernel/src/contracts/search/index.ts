export * from "./criteria";
export * from "./expressions";

export type Order = {
    property: string;
    direction: "asc" | "desc";
}[];

export type Page = {
    offset: number;
    limit: number;
};

export type Result<T> = {
    rows: T[];
    count: number;
    countIsEstimate: boolean;
};
