export declare const version: number;
export declare const totalAmount: string;
export declare const totalFee: string;
export declare const reward: string;
export declare const payloadHash: string;
export declare const timestamp: number;
export declare const numberOfTransactions: number;
export declare const payloadLength: number;
export declare const previousBlock: any;
export declare const generatorPublicKey: string;
export declare const transactions: ({
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
export declare const height: number;
export declare const id: string;
export declare const blockSignature: string;
