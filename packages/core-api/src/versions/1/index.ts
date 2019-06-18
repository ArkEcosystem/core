import Hapi from "@hapi/hapi";
import * as Accounts from "./accounts";
import * as Blocks from "./blocks";
import * as Delegates from "./delegates";
import * as Loader from "./loader";
import * as Peers from "./peers";
import * as Signatures from "./signatures";
import * as Transactions from "./transactions";

const register = async (server: Hapi.Server): Promise<void> => {
    const modules = [Accounts, Blocks, Delegates, Loader, Peers, Signatures, Transactions];

    for (const module of modules) {
        module.register(server);
    }
};

export = {
    register,
    name: "Public API - Legacy",
    version: "1.0.0",
};
