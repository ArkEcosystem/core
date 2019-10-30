import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

// todo: review the implementation
export const transformWallet = (wallet: Contracts.State.Wallet) => {
    return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        username: wallet.hasAttribute("delegate.username") ? wallet.getAttribute("delegate.username") : undefined,
        nonce: wallet.nonce.toFixed(),
        secondPublicKey: wallet.hasAttribute("secondPublicKey") ? wallet.getAttribute("secondPublicKey") : undefined,
        balance: Utils.BigNumber.make(wallet.balance).toFixed(),
        lockedBalance: wallet.hasAttribute("htlc.lockedBalance")
            ? wallet.getAttribute("htlc.lockedBalance").toFixed()
            : undefined,
        isDelegate: wallet.hasAttribute("delegate.username"),
        isResigned: wallet.hasAttribute("delegate.resigned"),
        vote: wallet.hasAttribute("vote") ? wallet.getAttribute("vote") : undefined,
        multiSignature: wallet.hasAttribute("multiSignature") ? wallet.getAttribute("multiSignature") : undefined,
    };
};
