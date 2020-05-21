export interface IDecryptResult {
    privateKey: Buffer;
    compressed: boolean;
}

export interface SlotInfo {
    startTime: number;
    endTime: number;
    blockTime: number;
    slotNumber: number;
    forgingStatus: boolean;
}

export type GetBlockTimeStampLookup = (blockheight: number) => number;
