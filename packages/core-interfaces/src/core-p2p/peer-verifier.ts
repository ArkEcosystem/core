export interface IPeerVerificationResult {
    readonly myHeight: number;
    readonly hisHeight: number;
    readonly highestCommonHeight: number;
    readonly forked: boolean;
}
