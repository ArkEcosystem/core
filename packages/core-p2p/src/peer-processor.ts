/* tslint:disable:max-line-length */

import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { EventEmitter, Logger, P2P } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { Peer } from "./peer";
import { isValidVersion, isWhitelisted } from "./utils";

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

        this.emitter.on(ApplicationEvents.InternalMilestoneChanged, () => {
            this.updatePeersAfterMilestoneChange();
        });
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

        if (!Utils.isValidPeer(peer) || this.storage.hasPendingPeer(peer.ip)) {
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

    private updatePeersAfterMilestoneChange(): void {
        const peers: P2P.IPeer[] = this.storage.getPeers();
        for (const peer of peers) {
            if (!isValidVersion(peer)) {
                this.emitter.emit("internal.p2p.disconnectPeer", { peer });
            }
        }
    }

    private async acceptNewPeer(peer, options: P2P.IAcceptNewPeerOptions = {}): Promise<void> {
        if (this.storage.getPeer(peer.ip)) {
            return;
        }

        const newPeer: P2P.IPeer = new Peer(peer.ip);

        try {
            this.storage.setPendingPeer(peer);

            await this.communicator.ping(newPeer, app.resolveOptions("p2p").verifyTimeout);

            this.storage.setPeer(newPeer);

            if (!options.lessVerbose || process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port} (v${newPeer.version})`);
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
