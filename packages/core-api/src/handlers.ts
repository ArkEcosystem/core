import Hapi from "@hapi/hapi";

import * as Blockchain from "./routes/blockchain";
import * as Blocks from "./routes/blocks";
import * as Delegates from "./routes/delegates";
import * as Locks from "./routes/locks";
import * as Node from "./routes/node";
import * as Peers from "./routes/peers";
import * as Rounds from "./routes/rounds";
import * as Transactions from "./routes/transactions";
import * as Votes from "./routes/votes";
import * as Wallets from "./routes/wallets";

export = {
    async register(server: Hapi.Server): Promise<void> {
        const handlers = [Blockchain, Blocks, Delegates, Locks, Node, Peers, Rounds, Transactions, Votes, Wallets];

        for (const handler of handlers) {
            handler.register(server);
        }
    },
    name: "Public API",
    version: "2.0.0",
};
