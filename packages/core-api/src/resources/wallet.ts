import { Container, Contracts } from "@arkecosystem/core-kernel";
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
    public raw(resource: Contracts.State.Wallet): object {
        return resource;
    }

    /**
     * Return the transformed representation of the resource.
     *
     * @param {*} resource
     * @returns {object}
     * @memberof Resource
     */
    public transform(resource: Contracts.State.Wallet): object {
        return {
            publicKey: resource.publicKey,
            address: resource.address,
            nonce: resource.nonce.toFixed(),
            balance: Utils.BigNumber.make(resource.balance).toFixed(),
            attributes: resource.attributes,
        };
    }
}
