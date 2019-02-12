import { SearchParameters } from "./search-parameters";

export interface ISearchParameterConverter {

    convert(params: any, orderBy?: any, paginate?: any): SearchParameters;
}
