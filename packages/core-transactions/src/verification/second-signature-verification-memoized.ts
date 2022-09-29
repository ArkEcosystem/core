import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { Cache } from "./cache";

@Container.injectable()
export class SecondSignatureVerificationMemoized
    extends Cache<{
        publicKey: string;
        result: boolean;
    }>
    implements Contracts.Transactions.SecondSignatureVerification
{
    public verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean {
        const value = this.cache.get(this.getKey(transaction))!;

        if (value && value.publicKey === publicKey) {
            return value.result;
        }

        const result = Transactions.Verifier.verifySecondSignature(transaction, publicKey);

        this.cache.set(this.getKey(transaction), { publicKey, result });

        return result;
    }
}
