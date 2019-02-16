import { SearchPaginate } from "../search";

export interface IBlocksBusinessRepository {

    search(params: any): Promise<any>
    findAll(params: any): Promise<any>;
    findById(id: string): Promise<any>;
    findByHeight(height: number): Promise<any>;
    findAllByGenerator(generatorPublicKey: string, paginate: SearchPaginate);
    findLastByPublicKey(generatorPublicKey: string): Promise<any>;
}
