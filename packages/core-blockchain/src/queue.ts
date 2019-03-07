import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { models } from "@arkecosystem/crypto";
import async from "async";
import { Blockchain } from "./blockchain";

const logger = app.resolvePlugin<Logger.ILogger>("logger");

export class Queue {
    private queue: any;

    constructor(private readonly blockchain: Blockchain, private readonly event: string) {
        this.queue = async.queue((block: models.IBlockData, cb) => {
            try {
                return blockchain.processBlock(new models.Block(block), cb);
            } catch (error) {
                logger.error(`Failed to process block in queue: ${block.height.toLocaleString()}`);
                logger.error(error.stack);
                return cb();
            }
        }, 1);

        this.drain();
    }

    public drain() {
        this.queue.drain = () => this.blockchain.dispatch(this.event);
    }

    public pause() {
        return this.queue.pause();
    }

    public clear() {
        return this.queue.remove(() => true);
    }

    public resume() {
        return this.queue.resume();
    }

    public remove(item) {
        return this.queue.remove(item);
    }

    public push(callback) {
        return this.queue.push(callback);
    }

    public length() {
        return this.queue.length();
    }

    public destroy() {
        return this.queue.kill();
    }
}
