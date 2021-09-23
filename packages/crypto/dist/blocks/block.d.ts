/// <reference types="node" />
import { IBlock, IBlockData, IBlockJson, IBlockVerification, ITransaction } from "../interfaces";
export declare class Block implements IBlock {
    static applySchema(data: IBlockData): IBlockData;
    static deserialize(hexString: string, headerOnly?: boolean): IBlockData;
    static serializeWithTransactions(block: IBlockData): Buffer;
    static serialize(block: IBlockData, includeSignature?: boolean): Buffer;
    static getIdHex(data: IBlockData): string;
    static toBytesHex(data: any): string;
    static getId(data: IBlockData): string;
    serialized: string;
    data: IBlockData;
    transactions: ITransaction[];
    verification: IBlockVerification;
    constructor({ data, transactions, id }: {
        data: IBlockData;
        transactions: ITransaction[];
        id?: string;
    });
    getHeader(): IBlockData;
    verifySignature(): boolean;
    toJson(): IBlockJson;
    verify(): IBlockVerification;
    private applyGenesisBlockFix;
}
