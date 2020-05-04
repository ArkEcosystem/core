import { Models } from "@packages/core-database";

export interface Codec {
    encodeBlock(block: any): Buffer;
    decodeBlock(buffer: Buffer): Models.Block;

    encodeTransaction(transaction: any): Buffer;
    decodeTransaction(buffer: Buffer): Models.Transaction;

    encodeRound(round: any): Buffer;
    decodeRound(buffer: Buffer): Models.Round;
}
