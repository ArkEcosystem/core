"use strict";
module.exports = (rows, params) => {
    if (params.offset || params.limit) {
        const offset = params.offset || 0;
        const limit = params.limit ? offset + params.limit : rows.length;
        return rows.slice(offset, limit);
    }
    return rows;
};
//# sourceMappingURL=limit-rows.js.map