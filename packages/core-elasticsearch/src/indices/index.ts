import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Blocks } from "./blocks";
import { Rounds } from "./rounds";
import { Transactions } from "./transactions";
import { Wallets } from "./wallets";

export const watchIndices = async (chunkSize: number): Promise<void> => {
    const indicers = [Blocks, Transactions, Wallets, Rounds];

    for (const Indicer of indicers) {
        const instance = new Indicer(chunkSize);

        app.resolvePlugin<Logger.ILogger>("logger").info(`[ES] Initialising ${instance.constructor.name}`);

        await instance.index();

        instance.listen();
    }
};
