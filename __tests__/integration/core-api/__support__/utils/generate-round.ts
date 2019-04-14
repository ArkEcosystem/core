import { Utils } from "@arkecosystem/crypto";

export function generateRound(delegates, round) {
    return delegates.map(delegate => ({
        round,
        publicKey: delegate,
        voteBalance: Utils.BigNumber.make("245098000000000"),
    }));
}
