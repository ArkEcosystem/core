export interface Codec {
    createDecodeStream(table: string): NodeJS.ReadWriteStream;
    createEncodeStream(table: string): NodeJS.ReadWriteStream;
}
