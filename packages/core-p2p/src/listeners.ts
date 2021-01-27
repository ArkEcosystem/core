import { Container, Contracts, Enums } from "@arkecosystem/core-kernel";

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
     * @type {Contracts.P2P.PeerRepository}
     * @memberof DisconnectInvalidPeers
     */
    @Container.inject(Container.Identifiers.PeerRepository)
    private readonly repository!: Contracts.P2P.PeerRepository;

    /**
     * @private
     * @type {Contracts.Kernel.EventDispatcher}
     * @memberof DisconnectInvalidPeers
     */
    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    /**
     * @returns {Promise<void>}
     * @memberof DisconnectInvalidPeers
     */
    public async handle(): Promise<void> {
        const peers: Contracts.P2P.Peer[] = this.repository.getPeers();

        for (const peer of peers) {
            if (!isValidVersion(this.app, peer)) {
                await this.events.dispatch(Enums.PeerEvent.Disconnect, { peer });
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
     * @type {Contracts.P2P.PeerRepository}
     * @memberof DisconnectPeer
     */
    @Container.inject(Container.Identifiers.PeerRepository)
    private readonly repository!: Contracts.P2P.PeerRepository;

    /**
     * @param {*} {peer}
     * @returns {Promise<void>}
     * @memberof DisconnectPeer
     */
    public async handle({ data }): Promise<void> {
        this.connector.disconnect(data.peer);

        this.repository.forgetPeer(data.peer);
    }
}
