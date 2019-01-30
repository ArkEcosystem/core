import { app } from "@arkecosystem/core-kernel";
import { models } from "@arkecosystem/crypto";
import async from "async";
import { Blockchain } from "../blockchain";
import { QueueInterface } from "./interface";

export class ProcessQueue extends QueueInterface {
    /**
     * Create an instance of the process queue.
     */
    constructor(readonly blockchain: Blockchain, readonly event: string) {
        super(blockchain, event);

        this.queue = async.queue((block: models.IBlockData, cb) => {
            try {
                return blockchain.processBlock(new models.Block(block), cb);
            } catch (error) {
                app.logger.error(`Failed to process block in ProcessQueue: ${block.height.toLocaleString()}`);
                app.logger.error(error.stack);
                return cb();
            }
        }, 1);

        this.drain();
    }
}
