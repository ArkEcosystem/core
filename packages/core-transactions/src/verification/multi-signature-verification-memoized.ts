import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

interface CachedValue {
    multiSignatureAsset: Interfaces.IMultiSignatureAsset;
    result: boolean;
}

@Container.injectable()
export class MultiSignatureVerificationMemoized implements Contracts.Transactions.MultiSignatureVerification {
    private cache: Map<string, CachedValue> = new Map();

    public verifySignatures(
        transaction: Interfaces.ITransactionData,
        multiSignatureAsset: Interfaces.IMultiSignatureAsset,
    ): boolean {
        const value = this.cache.get(this.getKey(transaction))!;
        if (value && Utils.isEqual(value.multiSignatureAsset, multiSignatureAsset)) {
            return value.result;
        }

        const result = Transactions.Verifier.verifySignatures(transaction, multiSignatureAsset);

        this.cache.set(this.getKey(transaction), { multiSignatureAsset: Utils.cloneDeep(multiSignatureAsset), result });

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
