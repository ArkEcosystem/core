import { app } from "@arkecosystem/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Interfaces, Utils } from "@arkecosystem/crypto";

export const transformWallet = (wallet: State.IWallet) => {
    const username: string = wallet.getAttribute("delegate.username");
    const multiSignature: Interfaces.IMultiSignatureAsset = wallet.getAttribute("multiSignature");

    // TODO: cleanup V3
    let business: any;
    if (app.has("core-magistrate-transactions")) {
        business = wallet.getAttribute("business");

        if (business) {
            business = {
                ...business.businessAsset,
                businessId: business.businessId,
                resigned: business.resigned,
            };
        }
    }

    return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        username,
        nonce: wallet.nonce.toFixed(),
        secondPublicKey: wallet.getAttribute("secondPublicKey"),
        balance: Utils.BigNumber.make(wallet.balance).toFixed(),
        lockedBalance: wallet.hasAttribute("htlc.lockedBalance")
            ? wallet.getAttribute("htlc.lockedBalance").toFixed()
            : undefined,
        isDelegate: !!username,
        isResigned: !!wallet.getAttribute("delegate.resigned"),
        vote: wallet.getAttribute("vote"),
        multiSignature,
        business,
    };
};
