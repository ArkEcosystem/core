import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container } from "@arkecosystem/core-kernel";

import { Resource } from "../interfaces";

@Container.injectable()
export class RoundResource implements Resource {
    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoSuite.CryptoManager;

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
            publicKey: resource.publicKey,
            votes: this.cryptoManager.LibraryManager.Libraries.BigNumber.make(resource.balance).toFixed(),
        };
    }
}
