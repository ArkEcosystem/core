import { Utils } from "@arkecosystem/crypto";

export function transformRoundDelegate(model) {
    return {
        publicKey: model.publicKey,
        votes: +Utils.BigNumber.make(model.balance).toFixed(),
    };
}
