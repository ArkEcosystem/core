import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import LRUCache from "lru-cache";

@Container.injectable()
export class SecondSignatureVerificationMemoizer implements Contracts.Transactions.SecondSignatureVerification {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transactions")
    private readonly configuration!: Providers.PluginConfiguration;

    private lruCache!: LRUCache<string, boolean>;

    @Container.postConstruct()
    public initialize() {
        this.lruCache = new LRUCache({ max: this.configuration.getRequired("memoizerCacheSize") });
    }

    public verifySecondSignature(transaction: Interfaces.ITransactionData, publicKey: string): boolean {
        const key = this.getKey(transaction, publicKey);

        if (this.lruCache.has(key)) {
            return this.lruCache.get(key)!;
        }

        const result = Transactions.Verifier.verifySecondSignature(transaction, publicKey);

        this.lruCache.set(key, result);

        return result;
    }

    private getKey(transaction: Interfaces.ITransactionData, publicKey: string): string {
        if (!transaction.id) {
            throw new Error("Missing transaction id");
        }

        return `${transaction.id}${publicKey}`;
    }
}
