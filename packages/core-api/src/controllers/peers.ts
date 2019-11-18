import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import semver from "semver";

import { PeerResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class PeersController extends Controller {
    @Container.inject(Container.Identifiers.PeerStorage)
    protected readonly peerStorage!: Contracts.P2P.PeerStorage;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const allPeers: Contracts.P2P.Peer[] = this.peerStorage.getPeers();

        let result = allPeers.sort((a, b) => {
            const latencyA: number | undefined = a.latency;
            const latencyB: number | undefined = b.latency;

            Utils.assert.defined<number>(latencyA);
            Utils.assert.defined<number>(latencyB);

            return latencyA - latencyB;
        });

        result = request.query.version
            ? result.filter(peer => peer.version === (request.query as any).version)
            : result;

        const count: number = result.length;

        const limit: number = +request.query.limit || 100;

        let offset: number = +(Utils.get(request.query, "offset", 0) || 0);

        if (offset <= 0 && +request.query.page > 1) {
            offset = (+request.query.page - 1) * limit;
        }

        if (Number.isNaN(offset)) {
            offset = 0;
        }

        const orderBy: string = request.query.orderBy as string;
        if (orderBy) {
            const order = orderBy.split(":");

            if (order[0] === "version") {
                result =
                    order[1].toLowerCase() === "asc"
                        ? result.sort((a, b) => semver.compare(a[order[0]], b[order[0]]))
                        : result.sort((a, b) => semver.rcompare(a[order[0]], b[order[0]]));
            }
        }

        result = result.slice(offset, offset + limit);

        return super.toPagination({ rows: result, count }, PeerResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        if (!this.peerStorage.hasPeer(request.params.ip)) {
            return Boom.notFound("Peer not found");
        }

        return super.respondWithResource(this.peerStorage.getPeer(request.params.ip), PeerResource);
    }
}
