"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@arkecosystem/utils");
const boom_1 = __importDefault(require("@hapi/boom"));
const dottie_1 = require("dottie");
const semver_1 = __importDefault(require("semver"));
const controller_1 = require("../shared/controller");
class PeersController extends controller_1.Controller {
    async index(request, h) {
        const allPeers = [...this.blockchain.p2p.getStorage().getPeers()];
        let result = allPeers;
        if (request.query.version) {
            const versionRange = semver_1.default.validRange(decodeURIComponent(request.query.version));
            if (versionRange) {
                result = result.filter(peer => semver_1.default.satisfies(peer.version, versionRange));
            }
            else {
                return boom_1.default.notFound("Invalid version range provided");
            }
        }
        const count = result.length;
        const limit = +request.query.limit || 100;
        let offset = +dottie_1.get(request.query, "offset", 0);
        if (offset <= 0 && +request.query.page > 1) {
            offset = (+request.query.page - 1) * limit;
        }
        if (Number.isNaN(offset)) {
            offset = 0;
        }
        const order = request.query.orderBy;
        if (order) {
            const orderByMapped = order.split(":").map(p => p.toLowerCase());
            switch (orderByMapped[0]) {
                case "version": {
                    result =
                        orderByMapped[1] === "asc"
                            ? result.sort((a, b) => semver_1.default.compare(a[orderByMapped[0]], b[orderByMapped[0]]))
                            : result.sort((a, b) => semver_1.default.rcompare(a[orderByMapped[0]], b[orderByMapped[0]]));
                    break;
                }
                case "height": {
                    result = utils_1.orderBy(result, el => el.state[orderByMapped[0]], orderByMapped[1] === "asc" ? "asc" : "desc");
                    break;
                }
                case "latency": {
                    result = utils_1.orderBy(result, orderByMapped[0], orderByMapped[1] === "asc" ? "asc" : "desc");
                    break;
                }
                default: {
                    result = result.sort((a, b) => a.latency - b.latency);
                    break;
                }
            }
        }
        else {
            result = result.sort((a, b) => a.latency - b.latency);
        }
        result = result.slice(offset, offset + limit);
        return super.toPagination({ rows: result, count }, "peer");
    }
    async show(request, h) {
        try {
            const peers = this.blockchain.p2p.getStorage().getPeers();
            const peer = peers.find(p => p.ip === request.params.ip);
            if (!peer) {
                return boom_1.default.notFound("Peer not found");
            }
            return super.respondWithResource(peer, "peer");
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
}
exports.PeersController = PeersController;
//# sourceMappingURL=controller.js.map