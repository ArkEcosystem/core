import { IParameters } from "../business-repository";
import { SearchParameters } from "./search-parameters";

export interface ISearchParameterConverter {
    convert(params: IParameters, orderBy?: any, paginate?: any): SearchParameters;
}
