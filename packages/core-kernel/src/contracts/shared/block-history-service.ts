import { Interfaces } from "@arkecosystem/crypto";

import { OrBlockCriteria } from "./criteria";
import { ListingOrder, ListingPage, ListingResult } from "./listing";

export interface BlockHistoryService {
    findOneByCriteria(...criteria: OrBlockCriteria[]): Promise<Interfaces.IBlockData | undefined>;

    findManyByCriteria(...criteria: OrBlockCriteria[]): Promise<Interfaces.IBlockData[]>;

    listByCriteria(
        page: ListingPage,
        order: ListingOrder,
        ...criteria: OrBlockCriteria[]
    ): Promise<ListingResult<Interfaces.IBlockData>>;
}
