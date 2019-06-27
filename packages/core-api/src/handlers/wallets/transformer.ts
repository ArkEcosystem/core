import { State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";

export const transformWallet = (model: State.IWallet) => {
    return {
        address: model.address,
        publicKey: model.publicKey,
        secondPublicKey: model.secondPublicKey,
        nonce: model.nonce.toFixed(),
        balance: Utils.BigNumber.make(model.balance).toFixed(),
        username: model.username,
        isDelegate: !!model.username,
        vote: model.vote,
    };
};
