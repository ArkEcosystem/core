import { CacheFactory } from "../../services/cache";
import { FilesystemFactory } from "../../services/filesystem";
import { LoggerFactory } from "../../services/logger";
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
        this.app.bind("factoryFilesystem", new FilesystemFactory(this.app));
        this.app.bind("factoryLogger", new LoggerFactory(this.app));
        this.app.bind("factoryCache", new CacheFactory(this.app));
        this.app.bind("factoryQueue", new QueueFactory(this.app));
    }
}
