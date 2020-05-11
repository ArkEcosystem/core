import { CryptoManager } from "@arkecosystem/core-crypto";
import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Types } from "@arkecosystem/crypto";

import { getProperty } from "./get-property";

export type OrderBy = (any | string)[];

// todo: review the implementation
export const sortEntries = (params: OrderBy, wallets: Contracts.State.Wallet[], cryptoManager: CryptoManager) => {
    const [iteratee, order] = params;

    if (["balance", "voteBalance"].includes(iteratee)) {
        return Object.values(wallets).sort((a: Contracts.State.Wallet, b: Contracts.State.Wallet) => {
            const iterateeA: Types.BigNumber =
                getProperty(a, iteratee) || cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
            const iterateeB: Types.BigNumber =
                getProperty(b, iteratee) || cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;

            return order === "asc" ? iterateeA.comparedTo(iterateeB) : iterateeB.comparedTo(iterateeA);
        });
    }

    return AppUtils.orderBy(
        wallets,
        // todo: revisit the implementation of this method when wallet search changes are implemented
        // most likely even remove it once the wallet changes have been fully implemented
        (wallet: Contracts.State.Wallet) => {
            if (typeof iteratee === "function") {
                // @ts-ignore
                return iteratee(wallet);
            }

            if (AppUtils.has(wallet, iteratee)) {
                return AppUtils.get(wallet, iteratee);
            }

            const delegateAttribute: string = `attributes.delegate.${iteratee}`;

            if (AppUtils.has(wallet, delegateAttribute)) {
                /* istanbul ignore next */
                return AppUtils.get(wallet, delegateAttribute);
            }

            return AppUtils.get(wallet, `attributes.${iteratee}`);
        },
        [order],
    );
};
