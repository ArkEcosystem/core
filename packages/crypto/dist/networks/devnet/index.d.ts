export declare const devnet: {
    exceptions: {
        "blocks": any[];
        "transactions": any[];
        "blocksTransactions": {};
        "outlookTable": {};
        "transactionIdFixTable": {};
        "wrongTransactionOrder": {};
        "negativeBalances": {};
    };
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
            "version": number;
            "network": number;
            "type": number;
            "timestamp": number;
            "senderPublicKey": string;
            "fee": string;
            "amount": string;
            "expiration": number;
            "recipientId": string;
            "signature": string;
            "typeGroup": number;
            "id": string;
            "senderId": string;
            "asset"?: undefined;
        } | {
            "version": number;
            "network": number;
            "type": number;
            "timestamp": number;
            "senderPublicKey": string;
            "fee": string;
            "amount": string;
            "asset": {
                "delegate": {
                    "username": string;
                };
            };
            "signature": string;
            "typeGroup": number;
            "id": string;
            "senderId": string;
            "expiration"?: undefined;
            "recipientId"?: undefined;
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
    } | {
        "height": number;
        "reward": number;
        "activeDelegates"?: undefined;
        "blocktime"?: undefined;
        "block"?: undefined;
        "epoch"?: undefined;
        "fees"?: undefined;
        "htlcEnabled"?: undefined;
        "vendorFieldLength"?: undefined;
        "aip11"?: undefined;
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
