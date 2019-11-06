import { Contracts } from "@arkecosystem/core-kernel";

export const transformFeeStatistics = (app: Contracts.Kernel.Application, model: any) => {
    return {
        type: model.type,
        fees: {
            minFee: parseInt(model.minFee, 10),
            maxFee: parseInt(model.maxFee, 10),
            avgFee: parseInt(model.avgFee, 10),
        },
    };
};
