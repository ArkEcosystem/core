"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const is_whitelisted_1 = require("../../utils/is-whitelisted");
const internalHandlers = __importStar(require("./internal"));
const peerHandlers = __importStar(require("./peer"));
exports.isAppReady = () => {
    return {
        ready: !!core_container_1.app.resolvePlugin("transaction-pool") && !!core_container_1.app.resolvePlugin("blockchain") && !!core_container_1.app.resolvePlugin("p2p"),
    };
};
exports.getHandlers = () => {
    return {
        peer: Object.keys(peerHandlers),
        internal: Object.keys(internalHandlers),
    };
};
exports.log = ({ req }) => {
    core_container_1.app.resolvePlugin("logger")[req.data.level](req.data.message);
};
exports.isForgerAuthorized = ({ req }) => {
    return { authorized: is_whitelisted_1.isWhitelisted(core_container_1.app.resolveOptions("p2p").remoteAccess, req.data.ip) };
};
exports.getConfig = () => {
    const config = core_container_1.app.resolveOptions("p2p");
    // add maxTransactionsPerRequest config from transaction pool
    config.maxTransactionsPerRequest = core_container_1.app.has("transaction-pool")
        ? core_container_1.app.resolveOptions("transaction-pool").maxTransactionsPerRequest || 40
        : 40;
    return config;
};
//# sourceMappingURL=utils.js.map