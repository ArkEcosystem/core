import { Interfaces } from "@arkecosystem/crypto";

export interface SecondSignatureVerificationMemoizer {
    verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean;
    clear(): void;
}

export interface MultiSignatureVerificationMemoizer {
    verifySignatures(
        transaction: Interfaces.ITransactionData,
        multiSignatureAsset: Interfaces.IMultiSignatureAsset,
    ): boolean;
    clear(): void;
}
