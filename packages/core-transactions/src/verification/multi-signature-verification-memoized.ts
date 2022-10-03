import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { Cache } from "./cache";

@Container.injectable()
export class MultiSignatureVerificationMemoized
    extends Cache<{
        multiSignatureAsset: Interfaces.IMultiSignatureAsset;
        result: boolean;
    }>
    implements Contracts.Transactions.MultiSignatureVerification
{
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
}
