import { Database, State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { orderBy } from "@arkecosystem/utils";
import { getProperty } from "./get-property";

export const sortEntries = (params: Database.IParameters, entries: State.IWallet[], defaultValue) => {
    const [iteratee, order] = params.orderBy ? params.orderBy : defaultValue;

    if (["balance", "voteBalance"].includes(iteratee)) {
        return Object.values(entries).sort((a: State.IWallet, b: State.IWallet) => {
            const iterateeA: Utils.BigNumber = getProperty(a, iteratee) || Utils.BigNumber.ZERO;
            const iterateeB: Utils.BigNumber = getProperty(b, iteratee) || Utils.BigNumber.ZERO;

            return order === "asc" ? iterateeA.comparedTo(iterateeB) : iterateeB.comparedTo(iterateeA);
        });
    }

    return orderBy(entries, [iteratee], [order as "desc" | "asc"]);
};
