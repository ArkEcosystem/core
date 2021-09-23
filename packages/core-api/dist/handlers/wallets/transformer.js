"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
exports.transformWallet = (wallet) => {
    const username = wallet.getAttribute("delegate.username");
    const multiSignature = wallet.getAttribute("multiSignature");
    const secondPublicKey = wallet.getAttribute("secondPublicKey");
    return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        nonce: wallet.nonce.toFixed(),
        balance: crypto_1.Utils.BigNumber.make(wallet.balance).toFixed(),
        attributes: wallet.getAttributes(),
        // TODO: remove with v3
        lockedBalance: wallet.hasAttribute("htlc.lockedBalance")
            ? wallet.getAttribute("htlc.lockedBalance").toFixed()
            : undefined,
        isDelegate: !!username,
        isResigned: !!wallet.getAttribute("delegate.resigned"),
        vote: wallet.getAttribute("vote"),
        multiSignature,
        ...(username && { username }),
        ...(secondPublicKey && { secondPublicKey }),
    };
};
//# sourceMappingURL=transformer.js.map