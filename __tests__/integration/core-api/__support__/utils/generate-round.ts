import { bignumify } from "@arkecosystem/core-utils";

export function generateRound(delegates, round) {
    return delegates.map(delegate => ({
        round,
        publicKey: delegate,
        voteBalance: bignumify("245098000000000"),
    }));
}
