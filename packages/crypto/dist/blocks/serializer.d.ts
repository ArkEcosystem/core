/// <reference types="node" />
import { IBlock, IBlockData } from "../interfaces";
export declare class Serializer {
    static size(block: IBlock): number;
    static serializeWithTransactions(block: IBlockData): Buffer;
    static serialize(block: IBlockData, includeSignature?: boolean): Buffer;
    private static headerSize;
    private static serializeHeader;
    private static serializeSignature;
}
