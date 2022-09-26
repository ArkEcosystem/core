import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import LRUCache from "lru-cache";

interface CacheValue {
    multiSignatureAsset: Interfaces.IMultiSignatureAsset;
    result: boolean;
}

@Container.injectable()
export class MultiSignatureVerificationMemoizer implements Contracts.Transactions.MultiSignatureVerificationMemoizer {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transactions")
    private readonly configuration!: Providers.PluginConfiguration;

    private lruCache!: LRUCache<string, CacheValue>;

    @Container.postConstruct()
    public initialize() {
        this.lruCache = new LRUCache({ max: this.configuration.getRequired("memoizerCacheSize") });
    }

    public verifySignatures(
        transaction: Interfaces.ITransactionData,
        multiSignatureAsset: Interfaces.IMultiSignatureAsset,
    ): boolean {
        const key = this.getKey(transaction);

        const value = this.lruCache.get(key)!;
        if (value && Utils.isEqual(value.multiSignatureAsset, multiSignatureAsset)) {
            return value.result;
        }

        const result = Transactions.Verifier.verifySignatures(transaction, multiSignatureAsset);

        this.lruCache.set(key, { multiSignatureAsset: Utils.cloneDeep(multiSignatureAsset), result });

        return result;
    }

    private getKey(transaction: Interfaces.ITransactionData): string {
        if (!transaction.id) {
            throw new Error("Missing transaction id");
        }

        return transaction.id;
    }
}
