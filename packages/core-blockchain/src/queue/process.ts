import { app } from "@arkecosystem/core-container";
import { models } from "@arkecosystem/crypto";
import async from "async";
import { QueueInterface } from "./interface";

const logger = app.resolvePlugin("logger");
const { Block } = models;

export class ProcessQueue extends QueueInterface {
    /**
     * Create an instance of the process queue.
     * @param  {Blockchain} blockchain
     * @return {void}
     */
    constructor(blockchain, event) {
        super(blockchain, event);

        this.queue = async.queue((block, cb) => {
            try {
                return blockchain.processBlock(new Block(block), cb);
            } catch (error) {
                logger.error(`Failed to process block in ProcessQueue: ${block.height.toLocaleString()}`);
                logger.error(error.stack);
                return cb();
            }
        }, 1);

        this.drain();
    }
}
