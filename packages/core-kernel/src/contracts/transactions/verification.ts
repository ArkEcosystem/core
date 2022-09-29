import { Interfaces } from "@arkecosystem/crypto";

export interface SecondSignatureVerification {
    verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean;

    clear(transaction: Interfaces.ITransactionData): void;
}

export interface MultiSignatureVerification {
    verifySignatures(
        transaction: Interfaces.ITransactionData,
        multiSignatureAsset: Interfaces.IMultiSignatureAsset,
    ): boolean;

    clear(transaction: Interfaces.ITransactionData): void;
}
