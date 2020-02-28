import { Interfaces } from "@arkecosystem/crypto";

export interface DownloadBlock extends Omit<Interfaces.IBlockData, "transactions"> {
    transactions: string[];
}
