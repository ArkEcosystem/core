export type ListingOrder = {
    property: string;
    direction: "asc" | "desc";
}[];

export type ListingPage = {
    offset: number;
    limit: number;
};

export type ListingResult<T> = {
    rows: T[];
    count: number;
    countIsEstimate: boolean;
};
