/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { Peer } from "./peer";
import { isValidPeer, isWhitelisted } from "./utils";

export class PeerProcessor implements P2P.IPeerProcessor {
    public server: any;
    public nextUpdateNetworkStatusScheduled: boolean;

    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    private readonly communicator: P2P.IPeerCommunicator;
    private readonly connector: P2P.IPeerConnector;
    private readonly storage: P2P.IPeerStorage;

    public constructor({
        communicator,
        connector,
        storage,
    }: {
        communicator: P2P.IPeerCommunicator;
        connector: P2P.IPeerConnector;
        storage: P2P.IPeerStorage;
    }) {
        this.communicator = communicator;
        this.connector = connector;
        this.storage = storage;
    }

    public async validateAndAcceptPeer(peer: P2P.IPeer, options: P2P.IAcceptNewPeerOptions = {}): Promise<void> {
        if (this.validatePeerIp(peer, options)) {
            await this.acceptNewPeer(peer, options);
        }
    }

    public validatePeerIp(peer, options: P2P.IAcceptNewPeerOptions = {}): boolean {
        if (app.resolveOptions("p2p").disableDiscovery && !this.storage.hasPendingPeer(peer.ip)) {
            this.logger.warn(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);
            return false;
        }

        if (!isValidPeer(peer) || this.storage.hasPendingPeer(peer.ip)) {
            return false;
        }

        if (!isWhitelisted(app.resolveOptions("p2p").whitelist, peer.ip)) {
            return false;
        }

        if (
            this.storage.getSameSubnetPeers(peer.ip).length >= app.resolveOptions("p2p").maxSameSubnetPeers &&
            !options.seed
        ) {
            if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.warn(
                    `Rejected ${peer.ip} because we are already at the ${
                        app.resolveOptions("p2p").maxSameSubnetPeers
                    } limit for peers sharing the same /24 subnet.`,
                );
            }

            return false;
        }

        return true;
    }

    private async acceptNewPeer(peer, options: P2P.IAcceptNewPeerOptions = {}): Promise<void> {
        if (this.storage.getPeer(peer.ip)) {
            return;
        }

        const newPeer: P2P.IPeer = new Peer(peer.ip);

        try {
            this.storage.setPendingPeer(peer);

            await this.communicator.ping(newPeer, 3000);

            this.storage.setPeer(newPeer);

            if (!options.lessVerbose) {
                this.logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port}`);
            }

            this.emitter.emit(ApplicationEvents.PeerAdded, newPeer);
        } catch (error) {
            this.connector.disconnect(newPeer);
        } finally {
            this.storage.forgetPendingPeer(peer);
        }

        return;
    }
}
