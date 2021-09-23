"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
const core_container_1 = require("@arkecosystem/core-container");
const Blockchain = __importStar(require("./blockchain"));
const Blocks = __importStar(require("./blocks"));
const Bridgechains = __importStar(require("./bridgechains"));
const Businesses = __importStar(require("./businesses"));
const Delegates = __importStar(require("./delegates"));
const Locks = __importStar(require("./locks"));
const Node = __importStar(require("./node"));
const Peers = __importStar(require("./peers"));
const Rounds = __importStar(require("./rounds"));
const Transactions = __importStar(require("./transactions"));
const Votes = __importStar(require("./votes"));
const Wallets = __importStar(require("./wallets"));
module.exports = {
    async register(server) {
        const modules = [Blockchain, Blocks, Delegates, Locks, Node, Peers, Rounds, Transactions, Votes, Wallets];
        for (const module of modules) {
            module.register(server);
        }
        // TODO: hook into core-api instead in V3
        if (core_container_1.app.has("core-magistrate-transactions")) {
            Businesses.register(server);
            Bridgechains.register(server);
        }
    },
    name: "Public API",
    version: "2.0.0",
};
//# sourceMappingURL=index.js.map