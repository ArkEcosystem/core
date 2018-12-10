/**
 * Create a "where" object for a sql query.
 * @param  {Object} parameters
 * @param  {Object} filters
 * @return {Object}
 */
export function buildFilterQuery(parameters, filters) {
    const where = [];

    if (filters.exact) {
        for (const elem of filters.exact) {
            if (typeof parameters[elem] !== "undefined") {
                where.push({
                    column: elem,
                    method: "equals",
                    value: parameters[elem],
                });
            }
        }
    }

    if (filters.between) {
        for (const elem of filters.between) {
            if (!parameters[elem]) {
                continue;
            }

            if (!parameters[elem].from && !parameters[elem].to) {
                where.push({
                    column: elem,
                    method: "equals",
                    value: parameters[elem],
                });
            }

            if (parameters[elem].from || parameters[elem].to) {
                where[elem] = {};

                if (parameters[elem].from) {
                    where.push({
                        column: elem,
                        method: "gte",
                        value: parameters[elem].from,
                    });
                }

                if (parameters[elem].to) {
                    where.push({
                        column: elem,
                        method: "lte",
                        value: parameters[elem].to,
                    });
                }
            }
        }
    }

    if (filters.wildcard) {
        for (const elem of filters.wildcard) {
            if (parameters[elem]) {
                where.push({
                    column: elem,
                    method: "like",
                    value: `%${parameters[elem]}%`,
                });
            }
        }
    }

    return where;
}
