import { Container } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { Resource } from "../interfaces";

@Container.injectable()
export class WalletResource implements Resource {
    /**
     * Return the raw representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public raw(resource): object {
        return resource;
    }

    /**
     * Return the transformed representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public transform(resource): object {
        return {
            address: resource.address,
            publicKey: resource.publicKey,
            username: resource.hasAttribute("delegate.username")
                ? resource.getAttribute("delegate.username")
                : undefined,
            nonce: resource.nonce.toFixed(),
            secondPublicKey: resource.hasAttribute("secondPublicKey")
                ? resource.getAttribute("secondPublicKey")
                : undefined,
            balance: Utils.BigNumber.make(resource.balance).toFixed(),
            lockedBalance: resource.hasAttribute("htlc.lockedBalance")
                ? resource.getAttribute("htlc.lockedBalance").toFixed()
                : undefined,
            isDelegate: resource.hasAttribute("delegate.username"),
            isResigned: resource.hasAttribute("delegate.resigned"),
            vote: resource.hasAttribute("vote") ? resource.getAttribute("vote") : undefined,
            multiSignature: resource.hasAttribute("multiSignature")
                ? resource.getAttribute("multiSignature")
                : undefined,
        };
    }
}
