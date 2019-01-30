import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app } from "@arkecosystem/core-kernel";
import { ServerCache } from "../../../services";
import { paginate, respondWith, toCollection, toResource } from "../utils";

const database = app.resolve<PostgresConnection>("database");

const index = async request => {
    const { rows } = await database.wallets.findAll({
        ...request.query,
        ...paginate(request),
    });

    return respondWith({
        accounts: toCollection(request, rows, "account"),
    });
};

const show = async request => {
    const account = await database.wallets.findById(request.query.address);

    if (!account) {
        return respondWith("Account not found", true);
    }

    return respondWith({
        account: toResource(request, account, "account"),
    });
};

const balance = async request => {
    const account = await database.wallets.findById(request.query.address);

    if (!account) {
        return respondWith({ balance: "0", unconfirmedBalance: "0" });
    }

    return respondWith({
        balance: account ? `${account.balance}` : "0",
        unconfirmedBalance: account ? `${account.balance}` : "0",
    });
};

const publicKey = async request => {
    const account = await database.wallets.findById(request.query.address);

    if (!account) {
        return respondWith("Account not found", true);
    }

    return respondWith({ publicKey: account.publicKey });
};

export function registerMethods(server) {
    ServerCache.make(server)
        .method("v1.accounts.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v1.accounts.show", show, 8, request => ({ address: request.query.address }))
        .method("v1.accounts.balance", balance, 8, request => ({ address: request.query.address }))
        .method("v1.accounts.publicKey", publicKey, 600, request => ({ address: request.query.address }));
}
