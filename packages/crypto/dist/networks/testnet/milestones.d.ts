declare const _exports: ({
    "height": number;
    "reward": number;
    "activeDelegates": number;
    "blocktime": number;
    "block": {
        "version": number;
        "maxTransactions": number;
        "maxPayload": number;
    };
    "epoch": string;
    "fees": {
        "staticFees": {
            "transfer": number;
            "secondSignature": number;
            "delegateRegistration": number;
            "vote": number;
            "multiSignature": number;
            "ipfs"?: undefined;
            "multiPayment"?: undefined;
            "delegateResignation"?: undefined;
        };
    };
    "htlcEnabled": boolean;
    "vendorFieldLength": number;
    "aip11"?: undefined;
} | {
    "height": number;
    "aip11": boolean;
    "fees": {
        "staticFees": {
            "ipfs": number;
            "multiPayment": number;
            "delegateResignation": number;
            "transfer"?: undefined;
            "secondSignature"?: undefined;
            "delegateRegistration"?: undefined;
            "vote"?: undefined;
            "multiSignature"?: undefined;
        };
    };
    "reward"?: undefined;
    "activeDelegates"?: undefined;
    "blocktime"?: undefined;
    "block"?: undefined;
    "epoch"?: undefined;
    "htlcEnabled"?: undefined;
    "vendorFieldLength"?: undefined;
})[];
export = _exports;
