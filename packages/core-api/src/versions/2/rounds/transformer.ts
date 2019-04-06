import { bignumify } from "@arkecosystem/core-utils";

export function transformRoundDelegate(model) {
    return {
        publicKey: model.publicKey,
        voteBalance: +bignumify(model.balance).toFixed(),
    };
}
