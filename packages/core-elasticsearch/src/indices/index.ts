import { app } from "@arkecosystem/core-kernel";

import { Blocks } from "./blocks";
import { Rounds } from "./rounds";
import { Transactions } from "./transactions";
import { Wallets } from "./wallets";

export const watchIndices = async (chunkSize: number): Promise<void> => {
    const indicers = [Blocks, Transactions, Wallets, Rounds];

    for (const Indicer of indicers) {
        const instance = new Indicer(chunkSize);

        app.log.info(`[ES] Initialising ${instance.constructor.name}`);

        await instance.index();

        instance.listen();
    }
};
