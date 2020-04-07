import { Utils } from "@arkecosystem/crypto";

import { OrCriteria, OrEqualCriteria, OrNumericCriteria } from "./filters";
import { Block } from "./models";
import { SearchPage, SearchResult } from "./search-utils";

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

export interface BlockService {
    search(criteria: OrBlockCriteria, order?: string, page?: SearchPage): Promise<SearchResult<Block>>;
    searchOne(criteria: BlockCriteria): Promise<Block>;
}
