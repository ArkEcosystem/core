import { Interfaces } from "@arkecosystem/core-crypto";

export interface DownloadBlock extends Omit<Interfaces.IBlockData, "transactions"> {
    transactions: string[];
}
