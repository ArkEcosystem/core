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
        const allPeers: Contracts.P2P.Peer[] = [...this.peerStorage.getPeers()];

        let result = allPeers;

        if (request.query.version) {
            const versionRange = semver.validRange(decodeURIComponent((request.query as any).version));

            if (versionRange) {
                result = result.filter(peer => peer.version && semver.satisfies(peer.version, versionRange));
            } else {
                return Boom.notFound("Invalid version range provided");
            }
        }

        const count: number = result.length;

        const limit: number = +request.query.limit || 100;

        let offset: number = +(Utils.get(request.query, "offset", 0) || 0);

        if (offset <= 0 && +request.query.page > 1) {
            offset = (+request.query.page - 1) * limit;
        }

        if (Number.isNaN(offset)) {
            offset = 0;
        }

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
                    result = Utils.orderBy(
                        result,
                        el => el.state[orderByMapped[0]],
                        orderByMapped[1] === "asc" ? "asc" : "desc",
                    );
                    break;
                }
                case "latency": {
                    result = Utils.orderBy(result, orderByMapped[0], orderByMapped[1] === "asc" ? "asc" : "desc");
                    break;
                }
                default: {
                    result = result.sort((a, b) => a.latency! - b.latency!);
                    break;
                }
            }
        } else {
            result = result.sort((a, b) => a.latency! - b.latency!);
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
