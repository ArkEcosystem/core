import Hapi from "@hapi/hapi";
import * as Blockchain from "./blockchain";
import * as Blocks from "./blocks";
import * as Delegates from "./delegates";
import * as Node from "./node";
import * as Peers from "./peers";
import * as Rounds from "./rounds";
import * as Transactions from "./transactions";
import * as Votes from "./votes";
import * as Wallets from "./wallets";

export = {
    async register(server: Hapi.Server): Promise<void> {
        const modules = [Blockchain, Blocks, Delegates, Node, Peers, Rounds, Transactions, Votes, Wallets];

        for (const module of modules) {
            module.register(server);
        }
    },
    name: "Public API",
    version: "2.0.0",
};
