"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const blocks_1 = require("./blocks");
const rounds_1 = require("./rounds");
const transactions_1 = require("./transactions");
const wallets_1 = require("./wallets");
exports.watchIndices = async (chunkSize) => {
    const indicers = [blocks_1.Blocks, transactions_1.Transactions, wallets_1.Wallets, rounds_1.Rounds];
    for (const Indicer of indicers) {
        const instance = new Indicer(chunkSize);
        core_container_1.app.resolvePlugin("logger").info(`[ES] Initialising ${instance.constructor.name}`);
        await instance.index();
        instance.listen();
    }
};
//# sourceMappingURL=index.js.map