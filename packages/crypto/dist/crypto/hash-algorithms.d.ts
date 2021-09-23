/// <reference types="node" />
export declare class HashAlgorithms {
    static ripemd160(buffer: Buffer | string): Buffer;
    static sha1(buffer: Buffer | string): Buffer;
    static sha256(buffer: Buffer | string | Buffer[]): Buffer;
    static hash160(buffer: Buffer | string): Buffer;
    static hash256(buffer: Buffer | string): Buffer;
    private static bufferize;
}
