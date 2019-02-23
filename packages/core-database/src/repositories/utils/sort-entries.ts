import { Database } from "@arkecosystem/core-interfaces";
import { orderBy } from "@arkecosystem/utils";

export function sortEntries(params: Database.IParameters, entries: any[], defaultValue) {
    const [iteratee, order] = params.orderBy ? params.orderBy.split(":") : defaultValue;

    const properties = ["balance", "fee", "amount", "reward", "voteBalance", "totalFee", "totalAmount"];

    const iteratees = properties.includes(iteratee) ? value => value[iteratee].toFixed() : [iteratee];

    return orderBy(entries, iteratees, [order as "desc" | "asc"]);
}
