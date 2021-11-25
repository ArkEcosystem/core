export interface IDecryptResult {
    privateKey: Buffer;
    compressed: boolean;
}

export type ISlot = {
    readonly no: number;
    readonly timestamp: number;
};
