/// <reference types="node" />
import { IBlock, IBlockData, IBlockJson, IKeyPair } from "../interfaces";
export declare class BlockFactory {
    static make(data: any, keys: IKeyPair): IBlock;
    static fromHex(hex: string): IBlock;
    static fromBytes(buffer: Buffer): IBlock;
    static fromJson(json: IBlockJson): IBlock;
    static fromData(data: IBlockData, options?: {
        deserializeTransactionsUnchecked?: boolean;
    }): IBlock;
    private static fromSerialized;
}
