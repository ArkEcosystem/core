declare const _exports: ({
    "height": number;
    "reward": number;
    "activeDelegates": number;
    "blocktime": number;
    "block": {
        "version": number;
        "maxTransactions": number;
        "maxPayload": number;
        "idFullSha256"?: undefined;
    };
    "epoch": string;
    "fees": {
        "staticFees": {
            "transfer": number;
            "secondSignature": number;
            "delegateRegistration": number;
            "vote": number;
            "multiSignature": number;
            "ipfs": number;
            "multiPayment": number;
            "delegateResignation": number;
            "htlcLock": number;
            "htlcClaim": number;
            "htlcRefund": number;
        };
    };
    "vendorFieldLength": number;
    "multiPaymentLimit": number;
    "aip11": boolean;
    "htlcEnabled": boolean;
} | {
    "height": number;
    "reward": number;
    "activeDelegates"?: undefined;
    "blocktime"?: undefined;
    "block"?: undefined;
    "epoch"?: undefined;
    "fees"?: undefined;
    "vendorFieldLength"?: undefined;
    "multiPaymentLimit"?: undefined;
    "aip11"?: undefined;
    "htlcEnabled"?: undefined;
} | {
    "height": number;
    "vendorFieldLength": number;
    "reward"?: undefined;
    "activeDelegates"?: undefined;
    "blocktime"?: undefined;
    "block"?: undefined;
    "epoch"?: undefined;
    "fees"?: undefined;
    "multiPaymentLimit"?: undefined;
    "aip11"?: undefined;
    "htlcEnabled"?: undefined;
} | {
    "height": number;
    "block": {
        "idFullSha256": boolean;
        "version"?: undefined;
        "maxTransactions"?: undefined;
        "maxPayload"?: undefined;
    };
    "reward"?: undefined;
    "activeDelegates"?: undefined;
    "blocktime"?: undefined;
    "epoch"?: undefined;
    "fees"?: undefined;
    "vendorFieldLength"?: undefined;
    "multiPaymentLimit"?: undefined;
    "aip11"?: undefined;
    "htlcEnabled"?: undefined;
})[];
export = _exports;
