import nsfw from "nsfw";

import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";

/**
 * @interface FileEvent
 */
interface FileEvent {
    /**
     * @type {number}
     * @memberof FileEvent
     */
    action: number;

    /**
     * @type {string}
     * @memberof FileEvent
     */
    directory: string;

    /**
     * @type {string}
     * @memberof FileEvent
     */
    file: string;
}

/**
 * @export
 * @class Watcher
 */
@injectable()
export class Watcher {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof Manager
     */
    @inject(Identifiers.Application)
    private readonly app: Application;

    /**
     * @private
     * @type {nsfw}
     * @memberof Watcher
     */
    private watcher: nsfw;

    /**
     * @returns {Promise<void>}
     * @memberof Watcher
     */
    public async start(): Promise<void> {
        const configFiles: string[] = [".env", "delegates.json", "peers.json", "plugins.js", "plugins.json"];

        this.watcher = await nsfw(this.app.configPath(), (events: FileEvent[]) => {
            for (const event of events) {
                /* istanbul ignore else */
                if (configFiles.includes(event.file) && event.action === nsfw.actions.MODIFIED) {
                    this.app.reboot();
                }
            }
        });

        await this.watcher.start();
    }

    /**
     * @returns {Promise<void>}
     * @memberof Watcher
     */
    public async stop(): Promise<void> {
        return this.watcher.stop();
    }
}
