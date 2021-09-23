import { IBlockData, ITransaction } from "../interfaces";
export declare class Deserializer {
    static deserialize(serializedHex: string, headerOnly?: boolean, options?: {
        deserializeTransactionsUnchecked?: boolean;
    }): {
        data: IBlockData;
        transactions: ITransaction[];
    };
    private static deserializeHeader;
    private static deserializeTransactions;
}
