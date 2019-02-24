import { SearchPaginate } from "../search";
import { IParameters } from "./parameters";

export interface IBlocksBusinessRepository {

    search(params: IParameters): Promise<any>;

    findAll(params: IParameters): Promise<any>;

    findById(id: string): Promise<any>;

    findByHeight(height: number): Promise<any>;

    findAllByGenerator(generatorPublicKey: string, paginate: SearchPaginate);

    findLastByPublicKey(generatorPublicKey: string): Promise<any>;
}
