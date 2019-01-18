import Hapi from "hapi";

import { blockInfo } from "./blocks/info";
import { blockLatest } from "./blocks/latest";
import { blockTransactions } from "./blocks/transactions";

import { walletBIP38Create } from "./wallets/bip38/create";
import { walletBIP38 } from "./wallets/bip38/show";
import { walletCreate } from "./wallets/create";
import { walletInfo } from "./wallets/info";
import { walletTransactions } from "./wallets/transactions";

import { transactionBIP38Create } from "./transactions/bip38/create";
import { transactionBroadcast } from "./transactions/broadcast";
import { transactionCreate } from "./transactions/create";
import { transactionInfo } from "./transactions/info";

export function registerMethods(server: Hapi.Server) {
    const registerMethod = method => {
        // @ts-ignore
        server.app.schemas[method.name] = method.schema;

        delete method.schema;

        server.method(method);
    };

    registerMethod(blockLatest);
    registerMethod(blockInfo);
    registerMethod(blockTransactions);
    registerMethod(walletBIP38Create);
    registerMethod(walletBIP38);
    registerMethod(walletCreate);
    registerMethod(walletInfo);
    registerMethod(walletTransactions);
    registerMethod(transactionBIP38Create);
    registerMethod(transactionBroadcast);
    registerMethod(transactionCreate);
    registerMethod(transactionInfo);
}
