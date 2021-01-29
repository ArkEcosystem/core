import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import semver from "semver";

import { PeerResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class PeersController extends Controller {
    @Container.inject(Container.Identifiers.PeerRepository)
    private readonly peerRepository!: Contracts.P2P.PeerRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const allPeers: Contracts.P2P.Peer[] = [...this.peerRepository.getPeers()];

        let results = allPeers;

        if (request.query.version) {
            const versionRange = semver.validRange(decodeURIComponent((request.query as any).version));

            if (versionRange) {
                results = results.filter((peer) => peer.version && semver.satisfies(peer.version, versionRange));
            } else {
                return Boom.notFound("Invalid version range provided");
            }
        }

        const totalCount: number = results.length;

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
            const orderByMapped = order.split(":").map((p) => p.toLowerCase());

            switch (orderByMapped[0]) {
                case "version": {
                    results =
                        orderByMapped[1] === "asc"
                            ? results.sort((a, b) => semver.compare(a[orderByMapped[0]], b[orderByMapped[0]]))
                            : results.sort((a, b) => semver.rcompare(a[orderByMapped[0]], b[orderByMapped[0]]));
                    break;
                }
                case "height": {
                    results = Utils.orderBy(
                        results,
                        (el) => el.state[orderByMapped[0]],
                        orderByMapped[1] === "asc" ? "asc" : "desc", // ? why desc is default
                    );
                    break;
                }
                case "latency": {
                    results = Utils.orderBy(results, orderByMapped[0], orderByMapped[1] === "asc" ? "asc" : "desc");
                    break;
                }
                default: {
                    results = results.sort((a, b) => a.latency! - b.latency!);
                    break;
                }
            }
        } else {
            results = results.sort((a, b) => a.latency! - b.latency!);
        }

        results = results.slice(offset, offset + limit);

        const resultsPage = {
            results,
            totalCount,
            meta: { totalCountIsEstimate: false },
        };

        return super.toPagination(resultsPage, PeerResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        if (!this.peerRepository.hasPeer(request.params.ip)) {
            return Boom.notFound("Peer not found");
        }

        return super.respondWithResource(this.peerRepository.getPeer(request.params.ip), PeerResource);
    }
}
