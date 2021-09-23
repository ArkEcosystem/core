import { Interfaces } from "@arkecosystem/crypto";
export declare const buildTransfer: (params: {
    recipientId: string;
    amount: string;
    vendorField?: string;
    passphrase: string;
    fee?: string;
}, method: "sign" | "signWithWif") => Promise<Interfaces.ITransactionData>;
export declare const buildDelegateRegistration: (params: {
    username: string;
    passphrase: string;
    fee?: string;
}, method: "sign" | "signWithWif") => Promise<Interfaces.ITransactionData>;
export declare const buildVote: (params: {
    publicKey: string;
    passphrase: string;
    fee?: string;
}, method: "sign" | "signWithWif") => Promise<Interfaces.ITransactionData>;
export declare const buildUnvote: (params: {
    publicKey: string;
    passphrase: string;
    fee?: string;
}, method: "sign" | "signWithWif") => Promise<Interfaces.ITransactionData>;
