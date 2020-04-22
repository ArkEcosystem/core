import { Interfaces, Utils } from "@arkecosystem/crypto";

import { ListOrder, ListPage, ListResult, OrCriteria, OrEqualCriteria, OrNumericCriteria } from "../search";

export type BlockCriteria = {
    id?: OrEqualCriteria<string>;
    version?: OrEqualCriteria<number>;
    timestamp?: OrNumericCriteria<number>;
    previousBlock?: OrEqualCriteria<string>;
    height?: OrNumericCriteria<number>;
    numberOfTransactions?: OrNumericCriteria<number>;
    totalAmount?: OrNumericCriteria<Utils.BigNumber>;
    totalFee?: OrNumericCriteria<Utils.BigNumber>;
    reward?: OrNumericCriteria<Utils.BigNumber>;
    payloadLength?: OrNumericCriteria<number>;
    payloadHash?: OrEqualCriteria<string>;
    generatorPublicKey?: OrEqualCriteria<string>;
    blockSignature?: OrEqualCriteria<string>;
};

export type OrBlockCriteria = OrCriteria<BlockCriteria>;

export interface BlockHistoryService {
    findOneByCriteria(criteria: OrBlockCriteria): Promise<Interfaces.IBlockData | undefined>;
    findManyByCriteria(criteria: OrBlockCriteria): Promise<Interfaces.IBlockData[]>;
    listByCriteria(
        criteria: OrBlockCriteria,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.IBlockData>>;
}
