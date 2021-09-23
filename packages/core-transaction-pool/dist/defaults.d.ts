export declare const defaults: {
    enabled: boolean;
    syncInterval: number;
    storage: string;
    maxTransactionsInPool: string | number;
    maxTransactionsPerSender: string | number;
    allowedSenders: any[];
    maxTransactionsPerRequest: string | number;
    maxTransactionAge: number;
    dynamicFees: {
        enabled: boolean;
        minFeePool: number;
        minFeeBroadcast: number;
        addonBytes: {
            transfer: number;
            secondSignature: number;
            delegateRegistration: number;
            vote: number;
            multiSignature: number;
            ipfs: number;
            multiPayment: number;
            delegateResignation: number;
            htlcLock: number;
            htlcClaim: number;
            htlcRefund: number;
        };
    };
};
