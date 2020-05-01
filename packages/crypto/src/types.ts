import * as networks from "./networks";

export type NetworkType =
    | typeof networks.mainnet.network
    | typeof networks.devnet.network
    | typeof networks.testnet.network;

export type NetworkName = keyof typeof networks;

export declare type BigNumberType = BigInt | number | string | BigNumber;

export interface BigNumberLibrary {
    readonly ZERO: BigNumber;
    readonly ONE: BigNumber;
    readonly SATOSHI: BigNumber;
    make(value: BigNumberType): BigNumber;
}

export declare abstract class BigNumber {
    public static readonly ZERO: BigNumber;
    public static readonly ONE: BigNumber;
    public static readonly SATOSHI: BigNumber;
    public constructor(value: BigNumberType);
    public static make(value: BigNumberType): BigNumber;
    public plus(other: BigNumberType): BigNumber;
    public minus(other: BigNumberType): BigNumber;
    public times(other: BigNumberType): BigNumber;
    public dividedBy(other: BigNumberType): BigNumber;
    public div(other: BigNumberType): BigNumber;
    public isZero(): boolean;
    public comparedTo(other: BigNumberType): number;
    public isLessThan(other: BigNumberType): boolean;
    public isLessThanEqual(other: BigNumberType): boolean;
    public isGreaterThan(other: BigNumberType): boolean;
    public isGreaterThanEqual(other: BigNumberType): boolean;
    public isEqualTo(other: BigNumberType): boolean;
    public isNegative(): boolean;
    public toFixed(): string;
    public toString(base?: number): string;
    public toJSON(): string;
}
