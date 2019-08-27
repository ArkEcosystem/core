import { Parameters } from "../business-repository";
import { SearchParameters } from "./search-parameters";

export interface SearchParameterConverter {
    convert(params: Parameters, orderBy?: any, paginate?: any): SearchParameters;
}
