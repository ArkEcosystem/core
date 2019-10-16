import { P2P } from "@arkecosystem/core-interfaces";
import { orderBy } from "@arkecosystem/utils";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import semver from "semver";
import { Controller } from "../shared/controller";

export class PeersController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const allPeers: P2P.IPeer[] = [...this.blockchain.p2p.getStorage().getPeers()];

        let result = allPeers.sort((a, b) => a.latency - b.latency);
        result = request.query.version
            ? result.filter(peer => peer.version === (request.query as any).version)
            : result;

        const count: number = result.length;

        result = result.slice(0, +request.query.limit || 100);

        const orderBy: string = request.query.orderBy as string;
        if (orderBy) {
            const order = orderBy.split(":").map(p => p.toLowerCase());

            switch (order[0]) {
                case "version": {
                    result =
                        order[1] === "asc"
                            ? result.sort((a, b) => semver.compare(a[order[0]], b[order[0]]))
                            : result.sort((a, b) => semver.rcompare(a[order[0]], b[order[0]]));
                    break;
                }
                case "height":
                case "latency":
                case "port": {
                    result = orderBy(result, order[0], order[1] === "asc" ? "asc" : "desc");
                    break;
                }
                default:
                    break;
            }
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
