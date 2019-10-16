import { P2P } from "@arkecosystem/core-interfaces";
import { orderBy } from "@arkecosystem/utils";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import semver from "semver";
import { Controller } from "../shared/controller";

export class PeersController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const allPeers: P2P.IPeer[] = [...this.blockchain.p2p.getStorage().getPeers()];

        let result = request.query.version
            ? allPeers.filter(peer => peer.version === (request.query as any).version)
            : allPeers;

        const count: number = result.length;

        result = result.slice(0, +request.query.limit || 100);

        const order: string = request.query.orderBy as string;
        if (order) {
            const orderByMapped = order.split(":").map(p => p.toLowerCase());

            switch (orderByMapped[0]) {
                case "version": {
                    result =
                        orderByMapped[1] === "asc"
                            ? result.sort((a, b) => semver.compare(a[orderByMapped[0]], b[orderByMapped[0]]))
                            : result.sort((a, b) => semver.rcompare(a[orderByMapped[0]], b[orderByMapped[0]]));
                    break;
                }
                case "height": {
                    result = orderBy(result, state[orderByMapped[0]], orderByMapped[1] === "asc" ? "asc" : "desc");
                    break;
                }
                case "latency": {
                    result = orderBy(result, orderByMapped[0], orderByMapped[1] === "asc" ? "asc" : "desc");
                    break;
                }
                default: {
                    result = result.sort((a, b) => a.latency - b.latency);
                    break;
                }
            }
        } else {
            result = result.sort((a, b) => a.latency - b.latency);
        }

        return super.toPagination({ rows: result, count }, "peer");
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const peers: P2P.IPeer[] = this.blockchain.p2p.getStorage().getPeers();
            const peer: P2P.IPeer = peers.find(p => p.ip === request.params.ip);

            if (!peer) {
                return Boom.notFound("Peer not found");
            }

            return super.respondWithResource(peer, "peer");
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
