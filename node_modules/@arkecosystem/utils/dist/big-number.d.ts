declare type BigNumberType = BigInt | number | string | BigNumber;
export declare class BigNumber {
    static readonly ZERO: BigNumber;
    static readonly ONE: BigNumber;
    static readonly SATOSHI: BigNumber;
    private readonly value;
    constructor(value: BigNumberType);
    static make(value: BigNumberType): BigNumber;
    plus(other: BigNumberType): BigNumber;
    minus(other: BigNumberType): BigNumber;
    times(other: BigNumberType): BigNumber;
    dividedBy(other: BigNumberType): BigNumber;
    div(other: BigNumberType): BigNumber;
    isZero(): boolean;
    comparedTo(other: BigNumberType): number;
    isLessThan(other: BigNumberType): boolean;
    isLessThanEqual(other: BigNumberType): boolean;
    isGreaterThan(other: BigNumberType): boolean;
    isGreaterThanEqual(other: BigNumberType): boolean;
    isEqualTo(other: BigNumberType): boolean;
    isNegative(): boolean;
    toFixed(): string;
    toString(base?: number): string;
    toJSON(): string;
    private toBigNumber;
}
export {};
