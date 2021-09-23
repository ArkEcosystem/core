export declare class InternalTransactionType {
    readonly type: number;
    readonly typeGroup: number;
    static from(type: number, typeGroup?: number): InternalTransactionType;
    private static types;
    private constructor();
    toString(): string;
}
