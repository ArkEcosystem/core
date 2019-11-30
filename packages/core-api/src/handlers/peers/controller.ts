import { P2P } from "@arkecosystem/core-interfaces";
import { orderBy } from "@arkecosystem/utils";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { get } from "dottie";
import semver from "semver";
import { Controller } from "../shared/controller";

export class PeersController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const allPeers: P2P.IPeer[] = [...this.blockchain.p2p.getStorage().getPeers()];

        let result = request.query.version
            ? allPeers.filter(peer => peer.version === (request.query as any).version)
            : allPeers;

        const count: number = result.length;

        const limit: number = +request.query.limit || 100;

        let offset: number = +get(request.query, "offset", 0);

        if (offset <= 0 && +request.query.page > 1) {
            offset = (+request.query.page - 1) * limit;
        }

        if (Number.isNaN(offset)) {
            offset = 0;
        }

        const [iteratee, direction] = request.query.orderBy as string[];

        if (request.query.orderBy && request.query.orderBy.length === 2) {
            switch (iteratee) {
                case "version": {
                    result =
                        direction === "asc"
                            ? result.sort((a, b) => semver.compare(a[iteratee], b[iteratee]))
                            : result.sort((a, b) => semver.rcompare(a[iteratee], b[iteratee]));
                    break;
                }
                case "height": {
                    result = orderBy(result, el => el.state[iteratee], direction === "asc" ? "asc" : "desc");
                    break;
                }
                case "latency": {
                    result = orderBy(result, iteratee, direction === "asc" ? "asc" : "desc");
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

        result = result.slice(offset, offset + limit);

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
