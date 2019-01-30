import { app } from "@arkecosystem/core-kernel";
import { models } from "@arkecosystem/crypto";
import async from "async";
import { Blockchain } from "../blockchain";
import { QueueInterface } from "./interface";

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
                app.logger.error(`Failed to rebuild block in RebuildQueue: ${block.height.toLocaleString()}`);
                return cb();
            }
        }, 1);

        this.drain();
    }
}
