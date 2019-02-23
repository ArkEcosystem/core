import { Database } from "@arkecosystem/core-interfaces";
import { orderBy } from "@arkecosystem/utils";

export function sortEntries(params: Database.IParameters, entries: any[], defaultValue) {
    const [iteratee, order] = params.orderBy ? params.orderBy.split(":") : defaultValue;

    const properties = ["balance", "fee", "amount", "reward", "voteBalance", "totalFee", "totalAmount"];

    if (properties.includes(iteratee)) {
        return Object.values(entries).sort((a: any, b: any) => {
            return order === "asc"
                ? +a[iteratee].minus(b[iteratee]).toFixed()
                : +b[iteratee].minus(a[iteratee]).toFixed();
        });
    }

    return orderBy(entries, [iteratee], [order as "desc" | "asc"]);
}
