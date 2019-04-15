import { Interfaces } from "@arkecosystem/crypto";
import { SearchPaginate } from "../search";
import { IParameters } from "./parameters";

export interface IBlocksPaginated {
    rows: Interfaces.IBlockData[];
    count: number;
}

export interface IBlocksBusinessRepository {
    search(params: IParameters): Promise<IBlocksPaginated>;

    findAll(params: IParameters): Promise<IBlocksPaginated>;

    findAllByGenerator(generatorPublicKey: string, paginate: SearchPaginate): Promise<IBlocksPaginated>;

    findById(id: string): Promise<Interfaces.IBlockData>;

    findByHeight(height: number): Promise<Interfaces.IBlockData>;

    findByIdOrHeight(idOrHeight: string | number): Promise<Interfaces.IBlockData>;
}
