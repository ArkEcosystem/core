import { app } from "@arkecosystem/core-container";
import { generateCacheKey, getCacheTimeout } from "../../utils";
import { paginate, respondWith, toCollection, toResource } from "../utils";

const database = app.resolvePlugin("database");

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
    const cacheDisabled = !server.app.config.cache.enabled;

    server.method(
        "v1.accounts.index",
        index,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 8 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request =>
                      generateCacheKey({
                          ...request.query,
                          ...paginate(request),
                      }),
              },
    );

    server.method(
        "v1.accounts.show",
        show,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 8 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request => generateCacheKey({ address: request.query.address }),
              },
    );

    server.method(
        "v1.accounts.balance",
        balance,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 8 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request => generateCacheKey({ address: request.query.address }),
              },
    );

    server.method(
        "v1.accounts.publicKey",
        publicKey,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 600 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request => generateCacheKey({ address: request.query.address }),
              },
    );
}
