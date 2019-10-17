import { app, Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import semver from "semver";

import { Controller } from "../shared/controller";

// todo: remove the abstract and use dependency injection if needed
export class PeersController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // todo: inject from container
        const allPeers: Contracts.P2P.Peer[] = app
            .get<Contracts.P2P.PeerStorage>(Container.Identifiers.PeerStorage)
            .getPeers();

        let result = allPeers.sort((a, b) => a.latency - b.latency);
        result = request.query.version
            ? result.filter(peer => peer.version === (request.query as any).version)
            : result;

        const count: number = result.length;

        const limit: number = +request.query.limit || 100;

        let offset: number = +Utils.get(request.query, "offset", 0);

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
                    order[1].toUpperCase() === "ASC"
                        ? result.sort((a, b) => semver.compare(a[order[0]], b[order[0]]))
                        : result.sort((a, b) => semver.rcompare(a[order[0]], b[order[0]]));
            }
        }

        result = result.slice(offset, offset + limit);

        return super.toPagination({ rows: result, count }, "peer");
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // todo: inject from container
            const peers: Contracts.P2P.Peer[] = app
                .get<Contracts.P2P.PeerStorage>(Container.Identifiers.PeerStorage)
                .getPeers();

            const peer: Contracts.P2P.Peer = peers.find(p => p.ip === request.params.ip);

            if (!peer) {
                return Boom.notFound("Peer not found");
            }

            return super.respondWithResource(peer, "peer");
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
