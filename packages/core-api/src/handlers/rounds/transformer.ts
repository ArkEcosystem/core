import { Utils } from "@arkecosystem/crypto";

// todo: review the implementation
export const transformRoundDelegate = model => {
    return {
        publicKey: model.publicKey,
        votes: Utils.BigNumber.make(model.balance).toFixed(),
    };
};
