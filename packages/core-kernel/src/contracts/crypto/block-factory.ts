export interface BlockFactory {
    validator: any;
    serializer: any;
    deserializer: any;
    make(data: any, keys: any, getBlockTimeStampLookup: any): any;
    fromHex(hex: string, getBlockTimeStampLookup: any): any;
    fromBytes(buffer: Buffer, getBlockTimeStampLookup: any): any;
    fromJson(json: any, getBlockTimeStampLookup: any): any;
    fromData(
        data: any,
        getBlockTimeStampLookup: any,
        options?: {
            deserializeTransactionsUnchecked?: boolean;
        },
    ): any;
}
