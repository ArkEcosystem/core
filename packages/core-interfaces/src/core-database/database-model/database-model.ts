import { SearchOperator } from "../search";

export interface ISearchableField {
    fieldName: string;
    supportedOperators: SearchOperator[];
}

export interface IModel {
    getName(): string;

    getTable(): string;

    query(): any;

    getColumnSet(): any;

    /* A list of fields on this model that can be queried, and each search-operator they support */
    getSearchableFields(): ISearchableField[];
}
