import { Interfaces } from "@arkecosystem/crypto";

import { OrBlockCriteria } from "./criteria";
import { ListingOrder, ListingPage, ListingResult } from "./listing";

export interface BlockHistoryService {
    findOneByCriteria(criteria: OrBlockCriteria): Promise<Interfaces.IBlockData | undefined>;
    findOneByIdOrHeight(idOrHeight: string | number): Promise<Interfaces.IBlockData | undefined>;

    findManyByCriteria(criteria: OrBlockCriteria): Promise<Interfaces.IBlockData[]>;

    listByCriteria(
        criteria: OrBlockCriteria,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.IBlockData>>;

    listByGeneratorPublicKey(
        generatorPublicKey: string,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.IBlockData>>;
}
