"use strict";
const get_property_1 = require("./get-property");
module.exports = (rows, params, filters) => {
    return rows.filter(item => {
        if (filters.hasOwnProperty("exact")) {
            for (const elem of filters.exact) {
                if (params[elem] !== undefined && get_property_1.getProperty(item, elem) !== params[elem]) {
                    return false;
                }
            }
        }
        if (filters.hasOwnProperty("like")) {
            for (const elem of filters.like) {
                if (params[elem] && !get_property_1.getProperty(item, elem).includes(params[elem])) {
                    return false;
                }
            }
        }
        if (filters.hasOwnProperty("between")) {
            for (const elem of filters.between) {
                if (!params[elem]) {
                    continue;
                }
                if (!params[elem].hasOwnProperty("from") &&
                    !params[elem].hasOwnProperty("to") &&
                    get_property_1.getProperty(item, elem) !== params[elem]) {
                    return false;
                }
                if (params[elem].hasOwnProperty("from") || params[elem].hasOwnProperty("to")) {
                    let isMoreThan = true;
                    let isLessThan = true;
                    if (params[elem].hasOwnProperty("from")) {
                        // @ts-ignore
                        isMoreThan = get_property_1.getProperty(item, elem) >= params[elem].from;
                    }
                    if (params[elem].hasOwnProperty("to")) {
                        // @ts-ignore
                        isLessThan = get_property_1.getProperty(item, elem) <= params[elem].to;
                    }
                    return isMoreThan && isLessThan;
                }
            }
        }
        if (filters.hasOwnProperty("in")) {
            for (const elem of filters.in) {
                if (params[elem] && Array.isArray(params[elem])) {
                    // @ts-ignore
                    return params[elem].indexOf(get_property_1.getProperty(item, elem)) > -1;
                }
            }
        }
        if (filters.hasOwnProperty("every")) {
            for (const elem of filters.every) {
                if (params[elem] && get_property_1.getProperty(item, elem)) {
                    if (Array.isArray(item[elem])) {
                        if (Array.isArray(params[elem])) {
                            // @ts-ignore
                            return params[elem].every(a => item[elem].includes(a));
                        }
                        else {
                            throw new Error('Filtering by "every" requires an Array');
                        }
                    }
                    else {
                        throw new Error("Property must be an array");
                    }
                }
            }
        }
        // NOTE: it was used to filter by `votes`, but that field was rejected and
        // replaced by `vote`. This filter is kept here just in case
        if (filters.hasOwnProperty("any")) {
            for (const elem of filters.any) {
                if (params[elem] && get_property_1.getProperty(item, elem)) {
                    if (Array.isArray(params[elem])) {
                        // @ts-ignore
                        if (item[elem].every(a => params[elem].indexOf(a) === -1)) {
                            return false;
                        }
                    }
                    else {
                        throw new Error('Fitering by "any" requires an Array');
                    }
                }
            }
        }
        return true;
    });
};
//# sourceMappingURL=filter-rows.js.map