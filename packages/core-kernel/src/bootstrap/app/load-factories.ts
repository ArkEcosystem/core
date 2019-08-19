import { CacheFactory } from "../../services/cache";
import { LoggerFactory } from "../../services/log";
import { QueueFactory } from "../../services/queue";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadFactories
 */
export class LoadFactories extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadFactories
     */
    public async bootstrap(): Promise<void> {
        this.app.bind("factoryLogger", new LoggerFactory(this.app));
        this.app.bind("factoryCache", new CacheFactory(this.app));
        this.app.bind("factoryQueue", new QueueFactory(this.app));
    }
}
