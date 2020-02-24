import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Identities, Interfaces, Utils } from "@arkecosystem/crypto";

export type Comparator<T> = (a: T, b: T) => number;

export class IteratorMany<T> implements Iterator<T> {
    private readonly results = new Map<Iterator<T>, IteratorResult<T>>();
    private readonly comparator: Comparator<T>;

    public constructor(iterators: Iterator<T>[], comparator: Comparator<T>) {
        this.comparator = comparator;

        for (const iterator of iterators) {
            const result = iterator.next();
            if (result.done === false) {
                this.results.set(iterator, result);
            }
        }
    }

    public next(): IteratorResult<T> {
        if (this.results.size === 0) {
            return { done: true, value: undefined };
        }

        const [iterator, result] = Array.from(this.results.entries()).reduce((min, entry) => {
            return this.comparator(entry[1].value, min[1].value) < 0 ? entry : min;
        });

        const nextResult = iterator.next();
        if (nextResult.done) {
            this.results.delete(iterator);
        } else {
            this.results.set(iterator, nextResult);
        }

        return result;
    }
}

export const describeTransactionType = (transaction: Interfaces.ITransaction): string => {
    if (transaction.typeGroup === Enums.TransactionTypeGroup.Core) {
        switch (transaction.type) {
            case Enums.TransactionType.DelegateRegistration:
                return "delegate registration";
            case Enums.TransactionType.DelegateResignation:
                return "delegate resignation";
            case Enums.TransactionType.HtlcClaim:
                return "htlc claim";
            case Enums.TransactionType.HtlcLock:
                return "htlc lock";
            case Enums.TransactionType.HtlcRefund:
                return "htlc refund";
            case Enums.TransactionType.Ipfs:
                return "ipfs";
            case Enums.TransactionType.MultiPayment:
                return "multi-payment";
            case Enums.TransactionType.MultiSignature:
                return "multi-signature";
            case Enums.TransactionType.SecondSignature:
                return "second signature";
            case Enums.TransactionType.Transfer:
                return "transfer";
            case Enums.TransactionType.Vote:
                return "vote";
        }
    }

    return "unknown";
};

export const describeTransaction = (transaction: Interfaces.ITransaction): string => {
    AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

    const id: string | undefined = transaction.id;
    const address: string | undefined = Identities.Address.fromPublicKey(transaction.data.senderPublicKey);
    const nonce: Utils.BigNumber | undefined = transaction.data.nonce;

    return `${address}#${nonce} ${id} (${describeTransactionType(transaction)})`;
};
