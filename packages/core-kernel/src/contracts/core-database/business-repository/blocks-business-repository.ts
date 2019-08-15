import { Interfaces } from "@arkecosystem/crypto";
import { ISearchPaginate } from "../search";
import { IParameters } from "./parameters";

export interface IBlocksPaginated {
    rows: Interfaces.IBlockData[];
    count: number;
}

export interface IBlocksBusinessRepository {
    search(params: IParameters): Promise<IBlocksPaginated>;

    findAllByGenerator(generatorPublicKey: string, paginate: ISearchPaginate): Promise<IBlocksPaginated>;

    findById(id: string): Promise<Interfaces.IBlockData>;

    findByHeight(height: number): Promise<Interfaces.IBlockData>;

    findByIdOrHeight(idOrHeight: string | number): Promise<Interfaces.IBlockData>;

    getBlockRewards(): Promise<any>;

    getLastForgedBlocks(): Promise<any>;

    getDelegatesForgedBlocks(): Promise<any>;
}
