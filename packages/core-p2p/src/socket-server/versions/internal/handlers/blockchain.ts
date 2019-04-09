import { app } from "@arkecosystem/core-container";
import { Blockchain, Logger } from "@arkecosystem/core-interfaces";

const logger = app.resolvePlugin<Logger.ILogger>("logger");

export const syncBlockchain = () => {
    logger.debug("Blockchain sync check WAKEUP requested by forger :bed:");

    app.resolvePlugin<Blockchain.IBlockchain>("blockchain").forceWakeup();
};
