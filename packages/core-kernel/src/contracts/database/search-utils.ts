export type SearchResult<TModel> = {
    rows: TModel[];
    count: number;
    countIsEstimate: boolean;
};

export type SearchPage = {
    offset: number;
    limit: number;
};

export type SearchOrderItem<TModel> = {
    property: keyof TModel;
    direction: "ASC" | "DESC";
};

export class SearchOrder<TModel> {
    public readonly items: SearchOrderItem<TModel>[];

    public constructor(items: SearchOrderItem<TModel>[]) {
        this.items = items;
    }

    public static parse<TModel>(strItems: string): SearchOrder<TModel> {
        const items = strItems.split(",").map(strItem => ({
            property: strItem.split(":")[0],
            direction: (strItem.split(":")[1] || "asc").toUpperCase(),
        }));
        return new SearchOrder(items as SearchOrderItem<TModel>[]);
    }
}
