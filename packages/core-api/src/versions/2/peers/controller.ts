import { app, Contracts } from "@arkecosystem/core-kernel";
import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class PeersController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const allPeers = await this.blockchain.p2p.getPeers();

            let result = allPeers.sort((a, b) => a.delay - b.delay);
            // @ts-ignore
            result = request.query.os
                ? // @ts-ignore
                  result.filter(peer => peer.os === (request.query as any).os)
                : result;
            // @ts-ignore
            result = request.query.status
                ? // @ts-ignore
                  result.filter(peer => peer.status === (request.query as any).status)
                : result;
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

                if (["port", "status", "os", "version"].includes(order[0])) {
                    result =
                        order[1].toUpperCase() === "ASC"
                            ? result.sort((a, b) => a[order[0]] - b[order[0]])
                            : result.sort((a, b) => a[order[0]] + b[order[0]]);
                }
            }

            return super.toPagination(request, { rows: result, count: allPeers.length }, "peer");
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const peers = await this.blockchain.p2p.getPeers();
            const peer = peers.find(p => p.ip === request.params.ip);

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
            const peers = app.p2p.getSuspendedPeers();

            return super.respondWithCollection(
                request,
                // @ts-ignore
                Object.values(peers).map(peer => peer.peer),
                "peer",
            );
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
