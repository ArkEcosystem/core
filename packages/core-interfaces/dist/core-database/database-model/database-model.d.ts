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
    getSearchableFields(): ISearchableField[];
}
