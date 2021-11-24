export interface IMilestone {
    readonly [key: string]: any;

    readonly height: number;
    readonly reward: number | string;
    readonly activeDelegates: number;
    readonly blocktime: number;
    readonly epoch: string;
    readonly vendorFieldLength: number;
    readonly multiPaymentLimit?: number;
    readonly htlcEnabled?: boolean;
    readonly aip11?: boolean;
    readonly aip36?: boolean;

    readonly block: {
        readonly [key: string]: any;

        readonly version: number;
        readonly maxTransactions: number;
        readonly maxPayload: number;
        readonly acceptExpiredTransactionTimestamps?: boolean;
        readonly idFullSha256?: boolean;
    };
}
