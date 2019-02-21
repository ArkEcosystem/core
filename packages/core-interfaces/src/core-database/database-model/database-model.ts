import { SearchOperator } from "../search";

export interface SearchableField {
    fieldName: string;
    supportedOperators: SearchOperator[];
}
export interface IDatabaseModel {

    getName(): string;

    /* A list of fields on this model that can be queried, and each search-operator they support */
    getSearchableFields(): SearchableField[];
}
