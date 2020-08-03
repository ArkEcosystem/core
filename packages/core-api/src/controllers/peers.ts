import { Container } from "@arkecosystem/core-kernel";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import { PeerCriteria, PeerResource, PeerResourceProvider, PeerResourcesPage } from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class PeersController extends Controller {
    @Container.inject(Identifiers.PeerResourceProvider)
    private readonly peerResourceProvider!: PeerResourceProvider;

    public index(request: Hapi.Request): PeerResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as PeerCriteria;

        return this.peerResourceProvider.getPeersPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): PeerResource | Boom {
        const peerIp = request.params.ip as string;
        const peer = this.peerResourceProvider.getPeer(peerIp);

        if (!peer) {
            return notFound("Peer not found");
        }

        return peer;
    }
}
