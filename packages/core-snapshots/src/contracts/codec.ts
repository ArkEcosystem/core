import { Models } from "@packages/core-database";

export interface Codec {
    blocksEncode(block: any): Buffer;
    blocksDecode(buffer: Buffer): Models.Block;

    transactionsEncode(transaction: any): Buffer;
    transactionsDecode(buffer: Buffer): Models.Transaction;

    roundsEncode(round: any): Buffer;
    roundsDecode(buffer: Buffer): Models.Round;
}
