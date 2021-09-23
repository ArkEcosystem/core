import { Database } from "@arkecosystem/core-interfaces";
export declare class SearchParameterConverter implements Database.IISearchParameterConverter {
    private databaseModel;
    constructor(databaseModel: Database.IModel);
    convert(params: Database.IParameters, orderBy?: any, paginate?: any): Database.ISearchParameters;
    private parsePaginate;
    private parseOrderBy;
    private parseSearchParameters;
}
