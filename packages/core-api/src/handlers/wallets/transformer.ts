import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

export const transformWallet = (wallet: Contracts.State.IWallet) => {
    const username: string = wallet.getAttribute("delegate.username");

    return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        username,
        nonce: wallet.nonce.toFixed(),
        secondPublicKey: wallet.getAttribute("secondPublicKey"),
        balance: Utils.BigNumber.make(wallet.balance).toFixed(),
        isDelegate: !!username,
        vote: wallet.getAttribute("vote"),
    };
};
