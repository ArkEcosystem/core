import { app } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { models } from "@arkecosystem/crypto";
import async from "async";
import { QueueInterface } from "./interface";

const logger = app.resolvePlugin<AbstractLogger>("logger");
const { Block } = models;

export class RebuildQueue extends QueueInterface {
    /**
     * Create an instance of the process queue.
     * @param  {Blockchain} blockchain
     * @return {void}
     */
    constructor(blockchain, event) {
        super(blockchain, event);

        this.queue = async.queue((block, cb) => {
            if (this.queue.paused) {
                return cb();
            }
            try {
                return blockchain.rebuildBlock(new Block(block), cb);
            } catch (error) {
                logger.error(`Failed to rebuild block in RebuildQueue: ${block.height.toLocaleString()}`);
                return cb();
            }
        }, 1);

        this.drain();
    }
}
