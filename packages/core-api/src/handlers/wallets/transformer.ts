import { State } from "@arkecosystem/core-interfaces";
import { Interfaces, Utils } from "@arkecosystem/crypto";

export const transformWallet = (wallet: State.IWallet) => {
    const username: string = wallet.getAttribute("delegate.username");
    const isResigned: boolean = wallet.getAttribute("delegate.resigned");
    const multiSignature: Interfaces.IMultiSignatureAsset = wallet.getAttribute("multiSignature");

    return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        username,
        nonce: wallet.nonce.toFixed(),
        secondPublicKey: wallet.getAttribute("secondPublicKey"),
        balance: Utils.BigNumber.make(wallet.balance).toFixed(),
        isDelegate: !!username,
        isResigned,
        multiSignature,
        vote: wallet.getAttribute("vote"),
    };
};
