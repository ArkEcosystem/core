export interface Codec {
    blocksEncode(block: any): Buffer;
    blocksDecode(buffer: Buffer): any;

    transactionsEncode(transaction: any): Buffer;
    transactionsDecode(buffer: Buffer): any;

    roundsEncode(round: any): Buffer;
    roundsDecode(buffer: Buffer): any;
}
