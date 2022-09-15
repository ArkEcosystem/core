import { Container } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

@Container.injectable()
export class SecondSignatureVerificationCache {
    private results: Map<string, boolean> = new Map();

    public verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean {
        if (this.has(transaction, publicKey)) {
            return this.get(transaction, publicKey);
        }

        const result = Transactions.Verifier.verifySecondSignature(transaction, publicKey);

        this.set(transaction, publicKey, result);

        return result;
    }

    private set(transaction: Interfaces.ITransactionData, publicKey: string, result: boolean): void {
        if (transaction.id) {
            this.results.set(this.getKey(transaction, publicKey), result);
        }
    }

    private has(transaction: Interfaces.ITransactionData, publicKey: string): boolean {
        return this.results.has(this.getKey(transaction, publicKey));
    }

    private get(transaction: Interfaces.ITransactionData, publicKey: string): boolean {
        const result = this.results.get(this.getKey(transaction, publicKey));
        if (result === undefined) {
            throw new Error("Key is not defined");
        }

        return result;
    }

    private getKey(transaction: Interfaces.ITransactionData, publicKey: string): string {
        if (!transaction.id) {
            throw new Error("Missing transaction id");
        }

        return `${transaction.id}${publicKey}`;
    }
}
