import { Interfaces } from "@arkecosystem/crypto";

export interface SecondSignatureVerificationMemoizer {
    verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean;
    clear(): void;
}
