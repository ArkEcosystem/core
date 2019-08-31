import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { orderBy } from "@arkecosystem/utils";

import { getProperty } from "./get-property";

export const sortEntries = (params: Contracts.Database.Parameters, entries: Contracts.State.Wallet[], defaultValue) => {
    const [iteratee, order] = params.orderBy ? params.orderBy : defaultValue;

    if (["balance", "voteBalance"].includes(iteratee)) {
        return Object.values(entries).sort((a: Contracts.State.Wallet, b: Contracts.State.Wallet) => {
            const iterateeA: Utils.BigNumber = getProperty(a, iteratee) || Utils.BigNumber.ZERO;
            const iterateeB: Utils.BigNumber = getProperty(b, iteratee) || Utils.BigNumber.ZERO;

            return order === "asc" ? iterateeA.comparedTo(iterateeB) : iterateeB.comparedTo(iterateeA);
        });
    }

    return orderBy(entries, [iteratee], [order as "desc" | "asc"]);
};
