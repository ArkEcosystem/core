import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import semver from "semver";
import { Controller } from "../shared/controller";

export class PeersController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const allPeers = await this.blockchain.p2p.getStorage().getPeers();

            let result = allPeers.sort((a, b) => a.latency - b.latency);
            // @ts-ignore
            result = request.query.port
                ? // @ts-ignore
                  result.filter(peer => peer.port === (request.query as any).port)
                : result;
            // @ts-ignore
            result = request.query.version
                ? // @ts-ignore
                  result.filter(peer => peer.version === (request.query as any).version)
                : result;
            // @ts-ignore
            result = result.slice(0, request.query.limit || 100);

            // @ts-ignore
            if (request.query.orderBy) {
                // @ts-ignore
                const order = request.query.orderBy.split(":");

                if (["port", "status"].includes(order[0])) {
                    result =
                        order[1].toUpperCase() === "ASC"
                            ? result.sort((a, b) => a[order[0]] - b[order[0]])
                            : result.sort((a, b) => a[order[0]] + b[order[0]]);
                }

                if (order[0] === "version") {
                    result =
                        order[1].toUpperCase() === "ASC"
                            ? result.sort((a, b) => semver.compare(a[order[0]], b[order[0]]))
                            : result.sort((a, b) => semver.rcompare(a[order[0]], b[order[0]]));
                }
            }

            return super.toPagination({ rows: result, count: allPeers.length }, "peer");
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const peers = await this.blockchain.p2p.getStorage().getPeers();
            const peer = peers.find(p => p.ip === request.params.ip);

            if (!peer) {
                return Boom.notFound("Peer not found");
            }

            return super.respondWithResource(peer, "peer");
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async suspended(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const peers = this.blockchain.p2p.getStorage().getSuspendedPeers();

            return super.respondWithCollection(
                // @ts-ignore
                Object.values(peers).map(peer => peer.peer),
                "peer",
            );
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
