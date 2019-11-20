import { QueryParameters } from "./query-parameters";
import { SearchParameters } from "./search-parameters";

export interface SearchParameterConverter {
    convert(params: QueryParameters, orderBy?: any, paginate?: any): SearchParameters;
}
