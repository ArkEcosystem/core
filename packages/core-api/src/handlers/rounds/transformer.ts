import { Utils } from "@arkecosystem/crypto";

export const transformRoundDelegate = model => {
    return {
        publicKey: model.publicKey,
        votes: Utils.BigNumber.make(model.balance).toFixed(),
    };
};
