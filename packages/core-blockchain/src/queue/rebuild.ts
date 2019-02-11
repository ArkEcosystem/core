import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { models } from "@arkecosystem/crypto";
import async from "async";
import { Blockchain } from "../blockchain";
import { QueueInterface } from "./interface";

const logger = app.resolvePlugin<Logger.ILogger>("logger");

export class RebuildQueue extends QueueInterface {
    /**
     * Create an instance of the process queue.
     */
    constructor(readonly blockchain: Blockchain, readonly event: string) {
        super(blockchain, event);

        this.queue = async.queue((block: models.IBlockData, cb) => {
            if (this.queue.paused) {
                return cb();
            }
            try {
                return blockchain.rebuildBlock(new models.Block(block), cb);
            } catch (error) {
                logger.error(`Failed to rebuild block in RebuildQueue: ${block.height.toLocaleString()}`);
                return cb();
            }
        }, 1);

        this.drain();
    }
}
