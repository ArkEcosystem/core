"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const utils_1 = require("@arkecosystem/utils");
const dayjs_1 = __importDefault(require("dayjs"));
const delay_1 = __importDefault(require("delay"));
const constants_1 = require("./constants");
const enums_1 = require("./enums");
const errors_1 = require("./errors");
const peer_verifier_1 = require("./peer-verifier");
const schemas_1 = require("./schemas");
const utils_2 = require("./utils");
class PeerCommunicator {
    constructor(connector) {
        this.connector = connector;
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.emitter = core_container_1.app.resolvePlugin("event-emitter");
        this.outgoingRateLimiter = utils_2.buildRateLimiter({
            // White listing anybody here means we would not throttle ourselves when sending
            // them requests, ie we could spam them.
            whitelist: [],
            remoteAccess: [],
            rateLimit: core_container_1.app.resolveOptions("p2p").rateLimit,
        });
    }
    async postBlock(peer, block) {
        const postBlockTimeout = 10000;
        return this.emit(peer, "p2p.peer.postBlock", {
            block: crypto_1.Blocks.Block.serializeWithTransactions({
                ...block.data,
                transactions: block.transactions.map(tx => tx.data),
            }),
        }, postBlockTimeout);
    }
    async postTransactions(peer, transactions) {
        const postTransactionsTimeout = 10000;
        return this.emit(peer, "p2p.peer.postTransactions", { transactions }, postTransactionsTimeout);
    }
    // ! do not rely on parameter timeoutMsec as guarantee that ping method will resolve within it !
    // ! peerVerifier.checkState can take more time !
    // TODO refactor on next version ?
    async ping(peer, timeoutMsec, force = false) {
        const deadline = new Date().getTime() + timeoutMsec;
        if (peer.recentlyPinged() && !force) {
            return undefined;
        }
        const getStatusTimeout = timeoutMsec < 5000 ? timeoutMsec : 5000;
        const pingResponse = await this.emit(peer, "p2p.peer.getStatus", undefined, getStatusTimeout);
        if (!pingResponse) {
            throw new errors_1.PeerStatusResponseError(peer.ip);
        }
        if (process.env.CORE_SKIP_PEER_STATE_VERIFICATION !== "true") {
            if (!this.validatePeerConfig(peer, pingResponse.config)) {
                throw new errors_1.PeerVerificationFailedError();
            }
            const peerVerifier = new peer_verifier_1.PeerVerifier(this, peer);
            if (deadline <= new Date().getTime()) {
                throw new errors_1.PeerPingTimeoutError(timeoutMsec);
            }
            peer.verificationResult = await peerVerifier.checkState(pingResponse.state, deadline);
            if (!peer.isVerified()) {
                throw new errors_1.PeerVerificationFailedError();
            }
        }
        peer.lastPinged = dayjs_1.default();
        peer.state = pingResponse.state;
        peer.plugins = pingResponse.config.plugins;
        return pingResponse.state;
    }
    async pingPorts(peer) {
        Promise.all(Object.entries(peer.plugins).map(async ([name, plugin]) => {
            peer.ports[name] = -1;
            try {
                const { statusCode } = await utils_1.http.head(`http://${peer.ip}:${plugin.port}/`);
                if (statusCode === 200) {
                    peer.ports[name] = plugin.port;
                }
            }
            catch (_a) {
                // tslint:disable-next-line: no-empty
            }
        }));
    }
    validatePeerConfig(peer, config) {
        if (config.network.nethash !== core_container_1.app.getConfig().get("network.nethash")) {
            return false;
        }
        peer.version = config.version;
        if (!utils_2.isValidVersion(peer)) {
            return false;
        }
        return true;
    }
    async getPeers(peer) {
        this.logger.debug(`Fetching a fresh peer list from ${peer.url}`);
        const getPeersTimeout = 5000;
        return this.emit(peer, "p2p.peer.getPeers", undefined, getPeersTimeout);
    }
    async hasCommonBlocks(peer, ids, timeoutMsec) {
        try {
            const getCommonBlocksTimeout = timeoutMsec < 5000 ? timeoutMsec : 5000;
            const body = await this.emit(peer, "p2p.peer.getCommonBlocks", { ids }, getCommonBlocksTimeout);
            if (!body || !body.common) {
                return false;
            }
            return body.common;
        }
        catch (error) {
            const sfx = timeoutMsec !== undefined ? ` within ${timeoutMsec} ms` : "";
            this.logger.error(`Could not determine common blocks with ${peer.ip}${sfx}: ${error.message}`);
            this.emitter.emit("internal.p2p.disconnectPeer", { peer });
        }
        return false;
    }
    async getPeerBlocks(peer, { fromBlockHeight, blockLimit = constants_1.constants.MAX_DOWNLOAD_BLOCKS, headersOnly, }) {
        const maxPayload = headersOnly ? blockLimit * constants_1.constants.KILOBYTE : constants_1.constants.DEFAULT_MAX_PAYLOAD;
        const peerBlocks = await this.emit(peer, "p2p.peer.getBlocks", {
            lastBlockHeight: fromBlockHeight,
            blockLimit,
            headersOnly,
            serialized: true,
        }, core_container_1.app.resolveOptions("p2p").getBlocksTimeout, maxPayload, false);
        if (!peerBlocks) {
            this.logger.debug(`Peer ${peer.ip} did not return any blocks via height ${fromBlockHeight.toLocaleString()}.`);
            return [];
        }
        for (const block of peerBlocks) {
            if (!block.transactions) {
                continue;
            }
            block.transactions = block.transactions.map(transaction => {
                const { data } = crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(Buffer.from(transaction, "hex"));
                data.blockId = block.id;
                return data;
            });
        }
        return peerBlocks;
    }
    parseHeaders(peer, response) {
        if (response.headers.height) {
            peer.state.height = +response.headers.height;
        }
    }
    validateReply(peer, reply, endpoint) {
        const schema = schemas_1.replySchemas[endpoint];
        if (schema === undefined) {
            this.logger.error(`Can't validate reply from "${endpoint}": none of the predefined schemas matches.`);
            return false;
        }
        const { error } = crypto_1.Validation.validator.validate(schema, reply);
        if (error) {
            if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                this.logger.debug(`Got unexpected reply from ${peer.url}/${endpoint}: ${error}`);
            }
            return false;
        }
        return true;
    }
    async emit(peer, event, data, timeout, maxPayload, disconnectOnError = true) {
        await this.throttle(peer, event);
        let response;
        try {
            this.connector.forgetError(peer);
            const timeBeforeSocketCall = new Date().getTime();
            maxPayload = maxPayload || 100 * constants_1.constants.KILOBYTE; // 100KB by default, enough for most requests
            const connection = this.connector.connect(peer, maxPayload);
            response = await utils_2.socketEmit(peer.ip, connection, event, data, {
                "Content-Type": "application/json",
            }, timeout);
            peer.latency = new Date().getTime() - timeBeforeSocketCall;
            this.parseHeaders(peer, response);
            if (!this.validateReply(peer, response.data, event)) {
                throw new Error(`Response validation failed from peer ${peer.ip} : ${JSON.stringify(response.data)}`);
            }
        }
        catch (e) {
            this.handleSocketError(peer, event, e, disconnectOnError);
            return undefined;
        }
        return response.data;
    }
    async throttle(peer, event) {
        const msBeforeReCheck = 1000;
        while (await this.outgoingRateLimiter.hasExceededRateLimit(peer.ip, event)) {
            this.logger.debug(`Throttling outgoing requests to ${peer.ip}/${event} to avoid triggering their rate limit`);
            await delay_1.default(msBeforeReCheck);
        }
    }
    handleSocketError(peer, event, error, disconnect = true) {
        if (!error.name) {
            return;
        }
        this.connector.setError(peer, error.name);
        switch (error.name) {
            case enums_1.SocketErrors.Validation:
                this.logger.debug(`Socket data validation error (peer ${peer.ip}) : ${error.message}`);
                break;
            case "Error":
                if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                    this.logger.debug(`Response error (peer ${peer.ip}/${event}) : ${error.message}`);
                }
                break;
            default:
                if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                    this.logger.debug(`Socket error (peer ${peer.ip}) : ${error.message}`);
                }
                if (disconnect) {
                    this.emitter.emit("internal.p2p.disconnectPeer", { peer });
                }
        }
    }
}
exports.PeerCommunicator = PeerCommunicator;
//# sourceMappingURL=peer-communicator.js.map