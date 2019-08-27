/* tslint:disable:max-line-length */

import { app, Contracts, Enums, Container } from "@arkecosystem/core-kernel";
import { Peer } from "./peer";
import { isValidPeer, isValidVersion, isWhitelisted } from "./utils";

export class PeerProcessor implements Contracts.P2P.PeerProcessor {
    public server: any;
    public nextUpdateNetworkStatusScheduled: boolean;

    private readonly logger: Contracts.Kernel.Log.Logger = app.log;
    private readonly emitter: Contracts.Kernel.Events.EventDispatcher = app.get<
        Contracts.Kernel.Events.EventDispatcher
    >(Container.Identifiers.EventDispatcherService);

    private readonly communicator: Contracts.P2P.PeerCommunicator;
    private readonly connector: Contracts.P2P.PeerConnector;
    private readonly storage: Contracts.P2P.PeerStorage;

    public constructor({
        communicator,
        connector,
        storage,
    }: {
        communicator: Contracts.P2P.PeerCommunicator;
        connector: Contracts.P2P.PeerConnector;
        storage: Contracts.P2P.PeerStorage;
    }) {
        this.communicator = communicator;
        this.connector = connector;
        this.storage = storage;

        this.emitter.listen("internal.milestone.changed", () => {
            this.updatePeersAfterMilestoneChange();
        });
    }

    public async validateAndAcceptPeer(
        peer: Contracts.P2P.Peer,
        options: Contracts.P2P.AcceptNewPeerOptions = {},
    ): Promise<void> {
        if (this.validatePeerIp(peer, options)) {
            await this.acceptNewPeer(peer, options);
        }
    }

    public validatePeerIp(peer, options: Contracts.P2P.AcceptNewPeerOptions = {}): boolean {
        if (app.get<any>("p2p.options").disableDiscovery && !this.storage.hasPendingPeer(peer.ip)) {
            this.logger.warning(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);
            return false;
        }

        if (!isValidPeer(peer) || this.storage.hasPendingPeer(peer.ip)) {
            return false;
        }

        if (!isWhitelisted(app.get<any>("p2p.options").whitelist, peer.ip)) {
            return false;
        }

        if (
            this.storage.getSameSubnetPeers(peer.ip).length >= app.get<any>("p2p.options").maxSameSubnetPeers &&
            !options.seed
        ) {
            if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.warning(
                    `Rejected ${peer.ip} because we are already at the ${
                        app.get<any>("p2p.options").maxSameSubnetPeers
                    } limit for peers sharing the same /24 subnet.`,
                );
            }

            return false;
        }

        return true;
    }

    private updatePeersAfterMilestoneChange(): void {
        const peers: Contracts.P2P.Peer[] = this.storage.getPeers();
        for (const peer of peers) {
            if (!isValidVersion(peer)) {
                this.connector.disconnect(peer);
                this.storage.forgetPeer(peer);
            }
        }
    }

    private async acceptNewPeer(peer, options: Contracts.P2P.AcceptNewPeerOptions = {}): Promise<void> {
        if (this.storage.getPeer(peer.ip)) {
            return;
        }

        const newPeer: Contracts.P2P.Peer = new Peer(peer.ip);

        try {
            this.storage.setPendingPeer(peer);

            await this.communicator.ping(newPeer, app.get<any>("p2p.options").verifyTimeout);

            this.storage.setPeer(newPeer);

            if (!options.lessVerbose) {
                this.logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port}`);
            }

            this.emitter.dispatch(Enums.Events.State.PeerAdded, newPeer);
        } catch (error) {
            this.connector.disconnect(newPeer);
        } finally {
            this.storage.forgetPendingPeer(peer);
        }

        return;
    }
}
