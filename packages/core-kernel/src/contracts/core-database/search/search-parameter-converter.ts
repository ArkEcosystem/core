import { IParameters } from "../business-repository";
import { ISearchParameters } from "./search-parameters";

export interface IISearchParameterConverter {
    convert(params: IParameters, orderBy?: any, paginate?: any): ISearchParameters;
}
