import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

interface CachedValue {
    publicKey: string;
    result: boolean;
}
@Container.injectable()
export class SecondSignatureVerificationMemoized implements Contracts.Transactions.SecondSignatureVerification {
    private cache: Map<string, CachedValue> = new Map();

    public verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean {
        const value = this.cache.get(this.getKey(transaction))!;

        if (value && value.publicKey === publicKey) {
            return value.result;
        }

        const result = Transactions.Verifier.verifySecondSignature(transaction, publicKey);

        this.cache.set(this.getKey(transaction), { publicKey, result });

        return result;
    }

    public clear(transaction: Interfaces.ITransactionData): void {
        this.cache.delete(this.getKey(transaction));
    }

    private getKey(transaction: Interfaces.ITransactionData): string {
        Utils.assert.defined<string>(transaction.id);
        return transaction.id;
    }
}
