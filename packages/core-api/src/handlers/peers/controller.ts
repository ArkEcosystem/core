import { P2P } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import semver from "semver";
import { Controller } from "../shared/controller";

export class PeersController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
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

        return super.toPagination({ rows: result, count: allPeers.length }, "peer");
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const peers: P2P.IPeer[] = await this.blockchain.p2p.getStorage().getPeers();
        const peer: P2P.IPeer = peers.find(p => p.ip === request.params.ip);

        if (!peer) {
            return Boom.notFound("Peer not found");
        }

        return super.respondWithResource(peer, "peer");
    }
}
