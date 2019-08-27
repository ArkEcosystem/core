import nsfw from "nsfw";
import { Application } from "../../contracts/kernel";
import { injectable, inject, Identifiers } from "../../container";

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
     * @memberof AbstractManager
     */
    @inject(Identifiers.Application)
    private readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof Watcher
     */
    public async watch(): Promise<void> {
        const configFiles: string[] = [".env", "delegates.json", "packages.js", "peers.json"];

        const watcher = await nsfw(this.app.configPath(), (events: FileEvent[]) => {
            for (const event of events) {
                if (configFiles.includes(event.file) && event.action === nsfw.actions.MODIFIED) {
                    this.app.reboot();
                }
            }
        });

        await watcher.start();
    }
}
