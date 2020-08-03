import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

import { PeerCriteria, PeerResource, PeerResourcesPage } from "./peer-resource";

@Container.injectable()
export class PeerResourceProvider {
    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly peerStorage!: Contracts.P2P.PeerStorage;

    public getPeer(ip: string, ...criterias: PeerCriteria[]): PeerResource | undefined {
        if (!this.peerStorage.hasPeer(ip)) {
            return undefined;
        }

        const peer = this.getPeerResource(this.peerStorage.getPeer(ip));

        if (!AppUtils.Search.testCriterias(peer, ...criterias)) {
            return undefined;
        }

        return peer;
    }

    public *getPeers(...criterias: PeerCriteria[]): Iterable<PeerResource> {
        for (const p2pPeer of this.peerStorage.getPeers()) {
            const peer = this.getPeerResource(p2pPeer);

            if (AppUtils.Search.testCriterias(peer, ...criterias)) {
                yield peer;
            }
        }
    }

    public getPeersPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: PeerCriteria[]
    ): PeerResourcesPage {
        return AppUtils.Search.getPage(pagination, ordering, this.getPeers(...criterias));
    }

    private getPeerResource(p2pPeer: Contracts.P2P.Peer): PeerResource {
        return {
            ip: p2pPeer.ip,
            port: p2pPeer.port,
            version: p2pPeer.version,
            height: p2pPeer.state ? p2pPeer.state.height : p2pPeer["height"],
            latency: p2pPeer.latency,
            plugins: p2pPeer.plugins,
        };
    }
}
