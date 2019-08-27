export interface PeerVerificationResult {
    readonly myHeight: number;
    readonly hisHeight: number;
    readonly highestCommonHeight: number;
    readonly forked: boolean;
}
