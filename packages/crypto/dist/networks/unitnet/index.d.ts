export declare const unitnet: {
    exceptions: {};
    genesisBlock: {
        "version": number;
        "totalAmount": string;
        "totalFee": string;
        "reward": string;
        "payloadHash": string;
        "timestamp": number;
        "numberOfTransactions": number;
        "payloadLength": number;
        "previousBlock": any;
        "generatorPublicKey": string;
        "transactions": ({
            "id": string;
            "timestamp": number;
            "version": number;
            "type": number;
            "fee": string;
            "amount": string;
            "recipientId": string;
            "senderPublicKey": string;
            "expiration": number;
            "network": number;
            "signature": string;
            "asset"?: undefined;
        } | {
            "id": string;
            "timestamp": number;
            "version": number;
            "type": number;
            "fee": string;
            "amount": string;
            "recipientId": any;
            "senderPublicKey": string;
            "asset": {
                "signature": {
                    "publicKey": string;
                };
                "delegate"?: undefined;
            };
            "signature": string;
            "expiration"?: undefined;
            "network"?: undefined;
        } | {
            "id": string;
            "timestamp": number;
            "version": number;
            "type": number;
            "fee": string;
            "amount": string;
            "recipientId": any;
            "senderPublicKey": string;
            "asset": {
                "delegate": {
                    "username": string;
                    "publicKey": string;
                };
                "signature"?: undefined;
            };
            "signature": string;
            "expiration"?: undefined;
            "network"?: undefined;
        })[];
        "height": number;
        "id": string;
        "blockSignature": string;
    };
    milestones: ({
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
    network: {
        "name": string;
        "messagePrefix": string;
        "bip32": {
            "public": number;
            "private": number;
        };
        "pubKeyHash": number;
        "nethash": string;
        "wif": number;
        "slip44": number;
        "aip20": number;
        "client": {
            "token": string;
            "symbol": string;
            "explorer": string;
        };
    };
};
