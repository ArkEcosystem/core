import { Interfaces } from "@arkecosystem/crypto";
import { SearchPaginate } from "../search";
import { Parameters } from "./parameters";

export interface BlocksPaginated {
    rows: Interfaces.IBlockData[];
    count: number;
}

export interface BlocksBusinessRepository {
    search(params: Parameters): Promise<BlocksPaginated>;

    findAllByGenerator(generatorPublicKey: string, paginate: SearchPaginate): Promise<BlocksPaginated>;

    findById(id: string): Promise<Interfaces.IBlockData>;

    findByHeight(height: number): Promise<Interfaces.IBlockData>;

    findByIdOrHeight(idOrHeight: string | number): Promise<Interfaces.IBlockData>;

    getBlockRewards(): Promise<any>;

    getLastForgedBlocks(): Promise<any>;

    getDelegatesForgedBlocks(): Promise<any>;
}
