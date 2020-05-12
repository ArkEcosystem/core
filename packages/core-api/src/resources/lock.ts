import { CryptoManager } from "@arkecosystem/core-crypto";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";

import { Resource } from "../interfaces";

@Container.injectable()
export class LockResource implements Resource {
    @Container.inject(Container.Identifiers.StateStore)
    protected readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoManager;

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
            ...resource,
            amount: resource.amount.toFixed(),
            timestamp: Utils.formatTimestamp(resource.timestamp, this.cryptoManager),
        };
    }
}
