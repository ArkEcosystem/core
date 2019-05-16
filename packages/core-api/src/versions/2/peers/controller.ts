import { P2P } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import semver from "semver";
import { Controller } from "../shared/controller";

export class PeersController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const allPeers: P2P.IPeer[] = await this.blockchain.p2p.getStorage().getPeers();

            let result = allPeers.sort((a, b) => a.latency - b.latency);
            result = request.query.version
                ? result.filter(peer => peer.version === (request.query as any).version)
                : result;
            result = result.slice(0, +request.query.limit || 100);

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

            return super.toPagination(request, { rows: result, count: allPeers.length }, "peer");
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const peers: P2P.IPeer[] = await this.blockchain.p2p.getStorage().getPeers();
            const peer: P2P.IPeer = peers.find(p => p.ip === request.params.ip);

            if (!peer) {
                return Boom.notFound("Peer not found");
            }

            return super.respondWithResource(request, peer, "peer");
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async suspended(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const peers: P2P.IPeerSuspension[] = this.blockchain.p2p.getStorage().getSuspendedPeers();

            return super.respondWithCollection(request, Object.values(peers).map(peer => peer.peer), "peer");
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
