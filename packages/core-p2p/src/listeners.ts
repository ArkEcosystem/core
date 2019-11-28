import { Container, Contracts } from "@arkecosystem/core-kernel";

import { PeerConnector } from "./peer-connector";
import { isValidVersion } from "./utils";

/**
 * @class DisconnectInvalidPeers
 * @implements {EventListener}
 */
@Container.injectable()
export class DisconnectInvalidPeers implements Contracts.Kernel.EventListener {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof DisconnectInvalidPeers
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    /**
     * @private
     * @type {Contracts.Kernel.EventDispatcher}
     * @memberof DisconnectInvalidPeers
     */
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.EventDispatcher;

    /**
     * @private
     * @type {Contracts.P2P.PeerStorage}
     * @memberof DisconnectInvalidPeers
     */
    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly storage!: Contracts.P2P.PeerStorage;

    /**
     * @returns {Promise<void>}
     * @memberof DisconnectInvalidPeers
     */
    public async handle(): Promise<void> {
        const peers: Contracts.P2P.Peer[] = this.storage.getPeers();

        for (const peer of peers) {
            if (!isValidVersion(this.app, peer)) {
                this.emitter.dispatch("internal.p2p.disconnectPeer", { peer });
            }
        }
    }
}

/**
 * @class DisconnectPeer
 * @implements {EventListener}
 */
@Container.injectable()
export class DisconnectPeer implements Contracts.Kernel.EventListener {
    /**
     * @private
     * @type {PeerConnector}
     * @memberof DisconnectPeer
     */
    @Container.inject(Container.Identifiers.PeerConnector)
    private readonly connector!: PeerConnector;

    /**
     * @private
     * @type {Contracts.P2P.PeerStorage}
     * @memberof DisconnectPeer
     */
    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly storage!: Contracts.P2P.PeerStorage;

    /**
     * @param {*} {data}
     * @returns {Promise<void>}
     * @memberof DisconnectPeer
     */
    public async handle({ data }): Promise<void> {
        this.connector.disconnect(data);

        this.storage.forgetPeer(data);
    }
}
