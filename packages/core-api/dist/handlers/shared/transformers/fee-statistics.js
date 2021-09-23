"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformFeeStatistics = (model) => {
    return {
        type: model.type,
        fees: {
            minFee: parseInt(model.minFee, 10),
            maxFee: parseInt(model.maxFee, 10),
            avgFee: parseInt(model.avgFee, 10),
        },
    };
};
//# sourceMappingURL=fee-statistics.js.map