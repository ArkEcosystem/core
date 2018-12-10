export function transformFeeStatistics(model: any) {
    return {
        type: model.type,
        fees: {
            minFee: parseInt(model.minFee, 10),
            maxFee: parseInt(model.maxFee, 10),
            avgFee: parseInt(model.avgFee, 10),
        },
    };
}
