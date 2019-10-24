import { Container, Contracts, Enums, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

import { Peer } from "./peer";
import { isValidVersion, isWhitelisted } from "./utils";

// todo: review the implementation
@Container.injectable()
export class PeerProcessor implements Contracts.P2P.PeerProcessor {
    public server: any;
    public nextUpdateNetworkStatusScheduled: boolean = false;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Log.Logger;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly emitter!: Contracts.Kernel.Events.EventDispatcher;

    @Container.inject(Container.Identifiers.PeerCommunicator)
    private readonly communicator!: Contracts.P2P.PeerCommunicator;

    @Container.inject(Container.Identifiers.PeerConnector)
    private readonly connector!: Contracts.P2P.PeerConnector;

    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly storage!: Contracts.P2P.PeerStorage;

    @Container.inject(Container.Identifiers.ServiceProviderRepository)
    private readonly serviceProviderRepository!: Providers.ServiceProviderRepository;

    public init() {
        this.emitter.listen("internal.milestone.changed", () => this.updatePeersAfterMilestoneChange());
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
        if (this.getConfig("disableDiscovery") && !this.storage.hasPendingPeer(peer.ip)) {
            this.logger.warning(`Rejected ${peer.ip} because the relay is in non-discovery mode.`);
            return false;
        }

        if (!Utils.isValidPeer(peer) || this.storage.hasPendingPeer(peer.ip)) {
            return false;
        }

        if (!isWhitelisted(this.getConfig("whitelist") || [], peer.ip)) {
            return false;
        }

        const maxSameSubnetPeers: number = AppUtils.assert.defined(this.getConfig("maxSameSubnetPeers"));

        if (this.storage.getSameSubnetPeers(peer.ip).length >= maxSameSubnetPeers && !options.seed) {
            if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.warning(
                    `Rejected ${peer.ip} because we are already at the ${this.getConfig(
                        "maxSameSubnetPeers",
                    )} limit for peers sharing the same /24 subnet.`,
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
                this.emitter.dispatch("internal.p2p.disconnectPeer", { peer });
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

            const verifyTimeout: number = AppUtils.assert.defined(this.getConfig("verifyTimeout"));

            await this.communicator.ping(newPeer, verifyTimeout);

            this.storage.setPeer(newPeer);

            if (!options.lessVerbose || process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port} (v${newPeer.version})`);
            }

            this.emitter.dispatch(Enums.Events.State.PeerAdded, newPeer);
        } catch (error) {
            this.connector.disconnect(newPeer);
        } finally {
            this.storage.forgetPendingPeer(peer);
        }

        return;
    }

    private getConfig<T>(key: string): T | undefined {
        return this.serviceProviderRepository
            .get("@arkecosystem/core-p2p")
            .config()
            .get<T>(key);
    }
}
