import { bignumify } from "@arkecosystem/core-utils";

export function transformRoundDelegate(model) {
    return {
        publicKey: model.publicKey,
        votes: +bignumify(model.balance).toFixed(),
    };
}
