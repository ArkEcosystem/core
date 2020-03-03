import nsfw, { NSFW } from "nsfw";

import { Application } from "../../contracts/kernel";
import { Identifiers, inject, injectable } from "../../ioc";

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
    private readonly app!: Application;

    /**
     * @private
     * @type {nsfw}
     * @memberof Watcher
     */
    private watcher!: NSFW;

    /**
     * @returns {Promise<void>}
     * @memberof Watcher
     */
    public async boot(): Promise<void> {
        const configFiles: string[] = [".env", "delegates.json", "peers.json", "plugins.js", "plugins.json"];

        this.watcher = await nsfw(this.app.configPath(), events => {
            for (const event of events) {
                if (event.action !== nsfw.actions.MODIFIED) {
                    continue;
                }

                if (configFiles.includes(event.file)) {
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
    public async dispose(): Promise<void> {
        return this.watcher.stop();
    }
}
