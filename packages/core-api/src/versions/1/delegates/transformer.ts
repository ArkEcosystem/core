import { delegateCalculator } from "@arkecosystem/core-utils";

export function transformDelegateLegacy(model) {
    return {
        username: model.username,
        address: model.address,
        publicKey: model.publicKey,
        vote: `${model.voteBalance}`,
        producedblocks: model.producedBlocks,
        missedblocks: model.missedBlocks,
        forged: model.forged,
        rate: model.rate,
        approval: delegateCalculator.calculateApproval(model),
        productivity: delegateCalculator.calculateProductivity(model),
    };
}
