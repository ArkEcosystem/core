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
export declare const height: number;
export declare const id: string;
export declare const blockSignature: string;
