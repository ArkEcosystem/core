import { Interfaces } from "@arkecosystem/crypto";

export interface SecondSignatureVerificationMemoizer {
    verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean;
}

export interface MultiSignatureVerificationMemoizer {
    verifySignatures(
        transaction: Interfaces.ITransactionData,
        multiSignatureAsset: Interfaces.IMultiSignatureAsset,
    ): boolean;
}
