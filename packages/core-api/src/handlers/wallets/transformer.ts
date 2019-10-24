import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Utils } from "@arkecosystem/crypto";

// todo: review the implementation
export const transformWallet = (wallet: Contracts.State.Wallet) => {
    const username: string = wallet.getAttribute("delegate.username");
    const multiSignature: Interfaces.IMultiSignatureAsset = wallet.getAttribute("multiSignature");

    return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        username,
        nonce: wallet.nonce.toFixed(),
        secondPublicKey: wallet.hasAttribute("secondPublicKey") ? wallet.getAttribute("secondPublicKey") : undefined,
        balance: Utils.BigNumber.make(wallet.balance).toFixed(),
        lockedBalance: wallet.hasAttribute("htlc.lockedBalance")
            ? wallet.getAttribute("htlc.lockedBalance").toFixed()
            : undefined,
        isDelegate: wallet.hasAttribute("delegate.username"),
        isResigned: wallet.hasAttribute("delegate.resigned"),
        vote: wallet.hasAttribute("vote") ? wallet.getAttribute("vote") : undefined,
        multiSignature,
    };
};
