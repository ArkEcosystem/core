import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { ServerCache } from "../../../services";
import { paginate, respondWith, toCollection, toResource } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

const index = async request => {
    const { rows } = await databaseService.wallets.findAll({
        ...request.query,
        ...paginate(request),
    });

    return respondWith({
        accounts: toCollection(request, rows, "account"),
    });
};

const show = async request => {
    const account = await databaseService.wallets.findById(request.query.address);

    if (!account) {
        return respondWith("Account not found", true);
    }

    return respondWith({
        account: toResource(request, account, "account"),
    });
};

const balance = async request => {
    const account = await databaseService.wallets.findById(request.query.address);

    if (!account) {
        return respondWith({ balance: "0", unconfirmedBalance: "0" });
    }

    return respondWith({
        balance: account ? `${account.balance}` : "0",
        unconfirmedBalance: account ? `${account.balance}` : "0",
    });
};

const publicKey = async request => {
    const account = await databaseService.wallets.findById(request.query.address);

    if (!account) {
        return respondWith("Account not found", true);
    }

    return respondWith({ publicKey: account.publicKey });
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v1.accounts.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v1.accounts.show", show, 8, request => ({ address: request.query.address }))
        .method("v1.accounts.balance", balance, 8, request => ({ address: request.query.address }))
        .method("v1.accounts.publicKey", publicKey, 600, request => ({ address: request.query.address }));
};
